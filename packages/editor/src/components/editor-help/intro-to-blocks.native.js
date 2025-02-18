/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import {
	HelpDetailBodyText,
	HelpDetailSectionHeadingText,
	HelpDetailImage,
} from './view-sections';

const IntroToBlocks = () => {
	return (
		<View style={ styles.helpDetailContainer }>
			<HelpDetailImage
				source={ require( './images/intro-blocks-1.png' ) }
			/>
			<Text style={ styles.helpDetailTitle }>
				{ __( 'Welcome to the world of blocks' ) }
			</Text>
			<HelpDetailBodyText
				text={ __(
					'Blocks are pieces of content that you can insert, rearrange, and style without needing to know how to code. Blocks are an easy and modern way for you to create beautiful layouts.'
				) }
			/>
			<HelpDetailSectionHeadingText text={ __( 'Rich text editing' ) } />
			<HelpDetailBodyText
				text={ __(
					'Blocks allow you to focus on writing your content, knowing that all the formatting tools you need are there to help you get your message across.'
				) }
			/>
			<HelpDetailImage
				source={ require( './images/intro-blocks-2.png' ) }
			/>
			<HelpDetailSectionHeadingText text={ __( 'Embed media' ) } />
			<HelpDetailBodyText
				text={ __(
					'Make your content stand out by adding images, gifs, videos, and embedded media to your pages.'
				) }
			/>
			<HelpDetailImage
				source={ require( './images/intro-blocks-3.png' ) }
			/>
			<HelpDetailSectionHeadingText text={ __( 'Build layouts' ) } />
			<HelpDetailBodyText
				text={ __(
					'Arrange your content into columns, add Call to Action buttons, and overlay images with text.'
				) }
			/>
			<HelpDetailImage
				source={ require( './images/intro-blocks-4.png' ) }
			/>
			<HelpDetailBodyText
				text={ __(
					'Give it a try by adding a few blocks to your post or page!'
				) }
			/>
		</View>
	);
};

export default IntroToBlocks;
