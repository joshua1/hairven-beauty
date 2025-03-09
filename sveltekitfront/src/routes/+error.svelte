<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} - {$page.error?.message || 'Error'}</title>
</svelte:head>

<div class="container mx-auto px-4 py-24 text-center">
	<h1 class="text-2xl mb-4">{$page.status} - {$page.error?.message || 'Page not found'}</h1>

	<p class="mb-8">Sorry, we couldn't find the page you were looking for.</p>

	<a href="/" class="inline-block bg-black text-white px-6 py-3 rounded-xs"> Return to Home </a>
</div>
