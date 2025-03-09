<script lang="ts">
	// Using Svelte 5 runes
	const currentYear = $state(new Date().getFullYear());
</script>

<footer class="bg-grayscale-50 py-12">
	<div class="container mx-auto px-4">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
			<!-- Company Info -->
			<div class="col-span-1 md:col-span-2">
				<h3 class="text-md font-medium mb-4">Sofa Society</h3>
				<p class="text-sm text-grayscale-600 mb-4">
					Transforming living spaces with unmatched comfort and style since 2010.
				</p>
				<p class="text-sm text-grayscale-600">
					© {currentYear} Sofa Society. All rights reserved.
				</p>
			</div>

			<!-- Quick Links -->
			<div>
				<h3 class="text-sm font-medium mb-4">Shop</h3>
				<ul class="space-y-2">
					<li>
						<a href="/store" class="text-sm text-grayscale-600 hover:text-black">All Products</a>
					</li>
					<li>
						<a href="/store?type=Sofas" class="text-sm text-grayscale-600 hover:text-black">Sofas</a
						>
					</li>
					<li>
						<a href="/store?type=Chairs" class="text-sm text-grayscale-600 hover:text-black"
							>Chairs</a
						>
					</li>
				</ul>
			</div>

			<!-- Company -->
			<div>
				<h3 class="text-sm font-medium mb-4">Company</h3>
				<ul class="space-y-2">
					<li><a href="/about" class="text-sm text-grayscale-600 hover:text-black">About Us</a></li>
					<li>
						<a href="/terms-of-use" class="text-sm text-grayscale-600 hover:text-black"
							>Terms of Use</a
						>
					</li>
					<li>
						<a href="/privacy-policy" class="text-sm text-grayscale-600 hover:text-black"
							>Privacy Policy</a
						>
					</li>
				</ul>
			</div>
		</div>
	</div>
</footer>
