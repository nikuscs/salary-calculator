<script setup lang="ts">
</script>
<template>
	<main class="bg-gray-100 dark:bg-gray-900 text-primary-500 dark:text-primary-400 min-h-screen flex-col">
		<div class="relative w-full h-full">
			<div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl gap-16 sm:gap-y-24 flex flex-col">
				<div class="w-full h-full relative">
					<slot />
				</div>
				<div
					class="absolute inset-0 landing-grid z-[-1] [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
				/>
			</div>
		</div>
	</main>
</template>
