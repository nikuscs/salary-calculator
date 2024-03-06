// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	ui: {
		primary: 'green',
		gray: 'cool'
	},
	modules: [
		'@nuxt/ui',
		'@nuxtjs/tailwindcss',
	],
	components: [
		{
			path: '~/components',
			prefix: 'X',
		},
	],
})
