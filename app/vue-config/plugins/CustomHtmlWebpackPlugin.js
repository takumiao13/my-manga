const pluginName = 'CustomHtmlWebpackPlugin';

class CustomHtmlWebpackPlugin {
	constructor(options) {
		this.options = options || {};
	}

	apply(compiler) {
		compiler.hooks.compilation.tap(pluginName, (compilation) => {

			compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
				pluginName,
				/**
				 * @param htmlPluginData
				 * @param htmlPluginData.assets
				 * @param htmlPluginData.outputName
				 * @param htmlPluginData.plugin
				 */
				(htmlPluginData, callback) => {
					callback(null, htmlPluginData);
				}
			);

			compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(
				pluginName,
				(htmlPluginData, callback) => {
					htmlPluginData.html = htmlPluginData.html
						.replace(/<meta name=theme-color[^>]+>/, '<meta name=theme-color content=#fff>')
					callback(null, htmlPluginData);
				}
			);

			compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(
				pluginName,
				/**
				 * @param htmlPluginData
				 * @param htmlPluginData.head
				 * @param htmlPluginData.body
				 * @param htmlPluginData.chunks
				 * @param htmlPluginData.plugin
				 */
				(htmlPluginData, callback) => {
					const { appName, publicModeDir } = this.options;
					htmlPluginData.head.push(
						// IE 11 Tile for Windows 8.1 Start Screen
						this.makeTag('meta', {
							name: 'application-name',
							content: appName
						}),

						this.makeTag('meta', {
							name: 'msapplication-square70x70logo',
							content: `${publicModeDir}/icons/mstile-70x70.png`
						}),

						this.makeTag('meta', {
							name: 'msapplication-square150x150logo',
							content: `${publicModeDir}/icons/mstile-150x150.png`
						}),

						this.makeTag('meta', {
							name: 'msapplication-wide310x150logo',
							content: `${publicModeDir}/icons/mstile-310x150.png`
						}),

						this.makeTag('meta', {
							name: 'msapplication-square310x310logo',
							content: `${publicModeDir}/icons/mstile-310x310.png`
						}),

						this.makeTag('meta', {
							name: 'msapplication-config',
							content: `${publicModeDir}/icons/browserconfig.xml`
						})
					);
					callback(null, htmlPluginData);
				}
			);
			
			compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
				pluginName,
				/**
				 * @param htmlPluginData
				 * @param htmlPluginData.html
				 * @param htmlPluginData.assets
				 * @param htmlPluginData.plugin
				 * @param htmlPluginData.childCompilerHash
				 * @param htmlPluginData.childCompilationOutputName
				 * @param htmlPluginData.assetJson
				 * @param htmlPluginData.outputName
				 */
				(htmlPluginData, callback) => {
					callback(null, htmlPluginData)
				}
			);
			
			compilation.hooks.htmlWebpackPluginAfterEmit.tapAsync(
				pluginName,
				/**
				 * @param htmlPluginData
				 * @param htmlPluginData.outputName
				 * @param htmlPluginData.plugin
				 * @param htmlPluginData.childCompilerHash
				 * @param htmlPluginData.childCompilationOutputName
				 * @param htmlPluginData.assetJson
				 */
				(htmlPluginData, callback) => {
					callback(null, htmlPluginData);
				}
			);
		});
	}

	makeTag(tagName, attributes, closeTag = false) {
		return {
			tagName,
			closeTag,
			attributes
		}
	}

	getTagHref(publicPath, href, assetsVersionStr) {
		let tagHref = `${href}${assetsVersionStr}`
		if (!(/(http(s?)):\/\//gi.test(href))) {
			tagHref = `${publicPath}${tagHref}`
		}
		return tagHref
	}
}

module.exports = CustomHtmlWebpackPlugin;