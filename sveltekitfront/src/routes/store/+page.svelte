<script lang="ts">
	import { page } from '$app/stores';

	// Using Svelte 5 runes for state management
	const products = $state([
		{
			id: 'prod_1',
			title: 'Modern Sofa',
			description: 'A comfortable modern sofa for your living room',
			price: 999,
			image: '/images/content/sofa.png'
		},
		{
			id: 'prod_2',
			title: 'Lounge Chair',
			description: 'Elegant lounge chair with premium comfort',
			price: 499,
			image: '/images/content/chair.png'
		}
	]);

	// Get the product type from the URL query parameter
	$effect(() => {
		const type = $page.url.searchParams.get('type');
		console.log('Product type filter:', type);
		// In a real app, we would filter products based on the type
	});
</script>

<svelte:head>
	<title>Store | Medusa SvelteKit Starter</title>
	<meta name="description" content="Browse our collection of high-quality furniture" />
</svelte:head>

<div class="container mx-auto py-12">
	<h1 class="text-2xl mb-8">Our Products</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
		{#each products as product}
			<div class="bg-grayscale-50 p-6 rounded-md">
				<img src={product.image} alt={product.title} class="w-full h-64 object-cover mb-4" />
				<h2 class="text-md font-medium">{product.title}</h2>
				<p class="text-grayscale-600 mb-2">{product.description}</p>
				<p class="text-md">${product.price}</p>
				<button class="mt-4 bg-black text-white px-4 py-2 rounded-xs"> Add to Cart </button>
			</div>
		{/each}
	</div>
</div>
