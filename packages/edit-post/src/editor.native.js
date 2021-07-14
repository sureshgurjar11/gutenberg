/**
 * External dependencies
 */
import memize from 'memize';
import { size, map, without } from 'lodash';
import { I18nManager } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { EditorProvider } from '@wordpress/editor';
import { parse, serialize, store as blocksStore } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	subscribeSetFocusOnTitle,
	subscribeFeaturedImageIdNativeUpdated,
	setFeaturedImage,
} from '@wordpress/react-native-bridge';
import { SlotFillProvider } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import { store as editPostStore } from './store';

class Editor extends Component {
	constructor( props ) {
		super( ...arguments );

		if ( props.initialHtmlModeEnabled && props.mode === 'visual' ) {
			// enable html mode if the initial mode the parent wants it but we're not already in it
			this.props.switchEditorMode( 'text' );
		}

		this.getEditorSettings = memize( this.getEditorSettings, {
			maxSize: 1,
		} );

		this.setTitleRef = this.setTitleRef.bind( this );
	}

	getEditorSettings(
		settings,
		hasFixedToolbar,
		focusMode,
		hiddenBlockTypes,
		blockTypes
	) {
		settings = {
			...settings,
			isRTL: I18nManager.isRTL,
			hasFixedToolbar,
			focusMode,
		};

		// Omit hidden block types if exists and non-empty.
		if ( size( hiddenBlockTypes ) > 0 ) {
			if ( settings.allowedBlockTypes === undefined ) {
				// if no specific flags for allowedBlockTypes are set, assume `true`
				// meaning allow all block types
				settings.allowedBlockTypes = true;
			}
			// Defer to passed setting for `allowedBlockTypes` if provided as
			// anything other than `true` (where `true` is equivalent to allow
			// all block types).
			const defaultAllowedBlockTypes =
				true === settings.allowedBlockTypes
					? map( blockTypes, 'name' )
					: settings.allowedBlockTypes || [];

			settings.allowedBlockTypes = without(
				defaultAllowedBlockTypes,
				...hiddenBlockTypes
			);
		}

		return settings;
	}

	componentDidMount() {
		const { editEntityRecord, postType, postId } = this.props;

		this.subscriptionParentSetFocusOnTitle = subscribeSetFocusOnTitle(
			() => {
				if ( this.postTitleRef ) {
					this.postTitleRef.focus();
				}
			}
		);

		// If we are to rely upon the "persist to native on change" approach below
		// in componentDidUpdate, a `subscribeFeaturedImageIdNativeUpdated`
		// subscription may be duplicative or unnecessary. In this exploratory work,
		// the subscription causes unnecessary bridge trips and re-renders.
		this.subscriptionParentFeaturedImageIdNativeUpdated = subscribeFeaturedImageIdNativeUpdated(
			( payload ) => {
				console.log( '>>> NATIVE => JS' );
				editEntityRecord( 'postType', postType, postId, {
					featured_media: payload.featuredImageId,
				} );
			}
		);
	}

	componentDidUpdate( prevProps ) {
		const currentFeaturedImageId = this.props.featuredImageId;
		const previousFeaturedImageId = prevProps.featuredImageId;
		console.log( '>>> Editor.cDU featuredImageId', {
			current: this.props.featuredImageId,
			previous: prevProps.featuredImageId,
		} );

		// If featured image changes, persist the change to the Native Store.
		// This location may not be the best for this logic.
		if ( currentFeaturedImageId !== previousFeaturedImageId ) {
			console.log( '>>> JS => NATIVE' );
			setFeaturedImage( currentFeaturedImageId );
		}
	}

	componentWillUnmount() {
		if ( this.subscriptionParentSetFocusOnTitle ) {
			this.subscriptionParentSetFocusOnTitle.remove();
		}

		if ( this.subscribeFeaturedImageIdNativeUpdated ) {
			this.subscribeFeaturedImageIdNativeUpdated.remove();
		}
	}

	setTitleRef( titleRef ) {
		this.postTitleRef = titleRef;
	}

	render() {
		const {
			settings,
			hasFixedToolbar,
			focusMode,
			initialEdits,
			hiddenBlockTypes,
			blockTypes,
			post,
			postId,
			postType,
			featuredImageId,
			initialHtml,
			...props
		} = this.props;

		const editorSettings = this.getEditorSettings(
			settings,
			hasFixedToolbar,
			focusMode,
			hiddenBlockTypes,
			blockTypes
		);

		const normalizedPost = post || {
			id: postId,
			title: {
				raw: props.initialTitle || '',
			},
			featured_media: featuredImageId,
			content: {
				// make sure the post content is in sync with gutenberg store
				// to avoid marking the post as modified when simply loaded
				// For now, let's assume: serialize( parse( html ) ) !== html
				raw: serialize( parse( initialHtml || '' ) ),
			},
			type: postType,
			status: 'draft',
			meta: [],
		};

		return (
			<SlotFillProvider>
				<EditorProvider
					settings={ editorSettings }
					post={ normalizedPost }
					initialEdits={ initialEdits }
					useSubRegistry={ false }
					{ ...props }
				>
					<Layout setTitleRef={ this.setTitleRef } />
				</EditorProvider>
			</SlotFillProvider>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isFeatureActive,
			getEditorMode,
			getPreference,
			__experimentalGetPreviewDeviceType,
		} = select( editPostStore );
		const { getBlockTypes } = select( blocksStore );
		const { getEditedPostAttribute } = select( 'core/editor' );
		const featuredImageId = getEditedPostAttribute( 'featured_media' );

		return {
			hasFixedToolbar:
				isFeatureActive( 'fixedToolbar' ) ||
				__experimentalGetPreviewDeviceType() !== 'Desktop',
			featuredImageId,
			focusMode: isFeatureActive( 'focusMode' ),
			mode: getEditorMode(),
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
			blockTypes: getBlockTypes(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { switchEditorMode } = dispatch( editPostStore );
		const { editEntityRecord } = dispatch( coreStore );
		return {
			switchEditorMode,
			editEntityRecord,
		};
	} ),
] )( Editor );
