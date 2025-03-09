<script lang="ts">
	import { page } from '$app/stores';

	// Using Svelte 5 runes
	let isMenuOpen = $state(false);

	const toggleMenu = () => {
		isMenuOpen = !isMenuOpen;
	};

	// Close menu when route changes
	$effect(() => {
		const path = $page.url.pathname;
		isMenuOpen = false;
	});
</script>

<header class="bg-white border-b border-grayscale-100">
	<div class="container mx-auto px-4 py-4">
		<div class="flex justify-between items-center">
			<!-- Logo -->
			<a href="/" class="text-lg font-medium">Sofa Society</a>

			<!-- Desktop Navigation -->
			<nav class="hidden md:flex space-x-8">
				<a
					href="/"
					class="text-sm hover:text-red-primary transition-colors {$page.url.pathname === '/'
						? 'text-red-primary'
						: ''}"
				>
					Home
				</a>
				<a
					href="/store"
					class="text-sm hover:text-red-primary transition-colors {$page.url.pathname.startsWith(
						'/store'
					)
						? 'text-red-primary'
						: ''}"
				>
					Store
				</a>
				<a
					href="/about"
					class="text-sm hover:text-red-primary transition-colors {$page.url.pathname.startsWith(
						'/about'
					)
						? 'text-red-primary'
						: ''}"
				>
					About
				</a>
			</nav>

			<!-- Mobile Menu Button -->
			<button class="md:hidden" on:click={toggleMenu} aria-label="Toggle menu">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>
		</div>

		<!-- Mobile Navigation -->
		{#if isMenuOpen}
			<nav class="md:hidden py-4 space-y-4">
				<a
					href="/"
					class="block text-sm hover:text-red-primary transition-colors {$page.url.pathname === '/'
						? 'text-red-primary'
						: ''}"
				>
					Home
				</a>
				<a
					href="/store"
					class="block text-sm hover:text-red-primary transition-colors {$page.url.pathname.startsWith(
						'/store'
					)
						? 'text-red-primary'
						: ''}"
				>
					Store
				</a>
				<a
					href="/about"
					class="block text-sm hover:text-red-primary transition-colors {$page.url.pathname.startsWith(
						'/about'
					)
						? 'text-red-primary'
						: ''}"
				>
					About
				</a>
			</nav>
		{/if}
	</div>
</header>
