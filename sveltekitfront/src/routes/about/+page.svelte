<script lang="ts">
	// Using Svelte 5 runes
	const companyInfo = $state({
		founded: 2010,
		mission:
			'To provide high-quality, thoughtfully designed furniture that merges comfort and style effortlessly.',
		vision: 'To transform living spaces into sanctuaries of relaxation and beauty.'
	});
</script>

<svelte:head>
	<title>About | Sofa Society</title>
	<meta
		name="description"
		content="Learn about Sofa Society and our mission to transform living spaces."
	/>
</svelte:head>

<div class="container mx-auto py-12">
	<h1 class="text-2xl mb-8">About Sofa Society</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
		<div>
			<img src="/images/content/sofa2.png" alt="Our showroom" class="w-full rounded-md" />
		</div>
		<div>
			<h2 class="text-lg mb-4">Our Story</h2>
			<p class="mb-4">
				Founded in {companyInfo.founded}, Sofa Society began with a simple idea: that a sofa is the
				heart of every home. Our founder's passion for design and comfort led to the creation of our
				first collection, which quickly gained popularity for its exceptional quality and timeless
				style.
			</p>
			<p>
				Today, we continue to innovate and expand our offerings while staying true to our core
				values of craftsmanship, sustainability, and customer satisfaction.
			</p>
		</div>
	</div>

	<div class="bg-grayscale-50 p-8 rounded-md mb-16">
		<h2 class="text-lg mb-4">Our Mission</h2>
		<p>{companyInfo.mission}</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<div class="bg-grayscale-30 p-6 rounded-md">
			<h3 class="text-md mb-3">Craftsmanship</h3>
			<p>Every piece is meticulously crafted with attention to detail and quality materials.</p>
		</div>
		<div class="bg-grayscale-30 p-6 rounded-md">
			<h3 class="text-md mb-3">Sustainability</h3>
			<p>
				We're committed to environmentally responsible practices throughout our production process.
			</p>
		</div>
		<div class="bg-grayscale-30 p-6 rounded-md">
			<h3 class="text-md mb-3">Customer Focus</h3>
			<p>Your satisfaction is our priority, from browsing to delivery and beyond.</p>
		</div>
	</div>
</div>
