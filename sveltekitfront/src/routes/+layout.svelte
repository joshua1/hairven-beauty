<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();

	// We would need to import fonts if needed, but for now we'll use system fonts
	// or you can add Google Fonts via the svelte:head tag if needed
</script>

<svelte:head>
	<html lang="en" data-mode="light" class="antialiased" />
</svelte:head>

<div class="font-sans min-h-screen flex flex-col">
	<Navbar />
	<main class="relative flex-grow">
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	:global(html) {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
			'Helvetica Neue', sans-serif;
	}
</style>
