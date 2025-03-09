<script lang="ts">
	// Using Svelte 5 runes for state management
	import { onMount } from 'svelte';

	// Mock data - in a real application, this would come from an API
	const productTypes = $state([
		{
			id: '1',
			value: 'Sofas',
			metadata: {
				image: {
					url: '/images/content/sofa.png'
				}
			}
		},
		{
			id: '2',
			value: 'Chairs',
			metadata: {
				image: {
					url: '/images/content/chair.png'
				}
			}
		}
	]);

	// Mock region data
	const region = $state({
		id: 'reg_123',
		name: 'Europe'
	});
</script>

<svelte:head>
	<title>Medusa SvelteKit Starter Template</title>
	<meta
		name="description"
		content="A performant frontend ecommerce starter template with SvelteKit and Medusa."
	/>
</svelte:head>

<div>
	<!-- Hero Section -->
	<div class="max-md:pt-18">
		<img
			src="/images/content/living-room.png"
			alt="Living room"
			class="md:h-screen md:object-cover w-full"
		/>
	</div>

	<!-- Main Content -->
	<div class="pt-8 pb-26 md:pt-26 md:pb-36">
		<!-- First Section -->
		<div class="container mx-auto grid grid-cols-12 gap-4 mb-26 md:mb-34">
			<div class="col-span-12 md:col-span-7">
				<h3 class="text-2xl">Elevate Your Living Space with Unmatched Comfort & Style</h3>
			</div>
			<div class="col-span-12 md:col-span-5 md:flex md:items-center">
				<div class="text-md">
					<p>Discover Your Perfect Sofa Today</p>
					<a href="/store" class="underline">Explore Now</a>
				</div>
			</div>
		</div>

		<!-- Product Types Section -->
		<div class="container mx-auto grid grid-cols-12 gap-4 mb-26 md:mb-36">
			<div class="col-span-12">
				<h3 class="text-lg md:text-2xl mb-8 md:mb-15">Our products</h3>
			</div>

			{#each productTypes as productType, index}
				<div class="col-span-6 {index % 2 === 0 ? 'col-start-1' : 'col-start-7'}">
					<a href={`/store?type=${productType.value}`}>
						{#if productType.metadata?.image?.url}
							<img
								src={productType.metadata.image.url}
								alt={productType.value}
								class="mb-2 md:mb-8 w-full"
							/>
						{/if}
						<p class="text-xs md:text-md">{productType.value}</p>
					</a>
				</div>
			{/each}
		</div>

		<!-- Collections Section Placeholder -->
		<div class="container mx-auto mb-26 md:mb-36">
			<h3 class="text-lg md:text-2xl mb-8">Collections</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="bg-grayscale-50 p-8 rounded-md">
					<h4 class="text-md mb-4">New Arrivals</h4>
					<p>Check out our latest items</p>
				</div>
				<div class="bg-grayscale-50 p-8 rounded-md">
					<h4 class="text-md mb-4">Best Sellers</h4>
					<p>Our most popular products</p>
				</div>
			</div>
		</div>

		<!-- About Section -->
		<div class="container mx-auto grid grid-cols-12 gap-4">
			<div class="col-span-12">
				<h3 class="text-lg md:text-2xl mb-8 md:mb-15">About Sofa Society</h3>
				<img
					src="/images/content/sofa2.png"
					alt="Sofa"
					class="mb-8 md:mb-16 max-md:aspect-[3/2] max-md:object-cover w-full"
				/>
			</div>
			<div class="col-span-12 md:col-span-6">
				<h2 class="text-lg md:text-2xl">
					At Sofa Society, we believe that a sofa is the heart of every home.
				</h2>
			</div>
			<div class="col-span-12 md:col-span-6 mt-6 md:mt-19">
				<div class="md:text-md">
					<p class="mb-5 md:mb-9">
						We are dedicated to delivering high-quality, thoughtfully designed sofas that merge
						comfort and style effortlessly.
					</p>
					<p class="mb-5 md:mb-3">
						Our mission is to transform your living space into a sanctuary of relaxation and beauty,
						with products built to last.
					</p>
					<a href="/about" class="underline">Read more about Sofa Society</a>
				</div>
			</div>
		</div>
	</div>
</div>
