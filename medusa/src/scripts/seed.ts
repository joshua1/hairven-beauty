import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createProductTypesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  uploadFilesWorkflow,
} from '@medusajs/medusa/core-flows'
import {
  ExecArgs,
  IFulfillmentModuleService,
  ISalesChannelModuleService,
  IStoreModuleService,
} from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from '@medusajs/framework/utils'
import type HairPropsModuleService from 'src/modules/hair-props/service'
import type { ProductLengthModelType } from 'src/modules/hair-props/models/product-length'
import * as fs from 'fs/promises'
import * as path from 'path'

async function getImageUrlContent(url: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch image "${url}": ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()

  return Buffer.from(arrayBuffer).toString('binary')
}

/**
 * Reads an image file from the seed-images directory and returns its contents as a binary string
 * @param filename The name of the image file to read
 * @returns The file contents as a binary string
 */
async function getImageFileContent(filename: string) {
  // Using the same approach as the existing code in this file
  const fs = require('fs/promises')
  const path = require('path')

  // Use path.resolve to get an absolute path to the seed-images directory
  const imagePath = path.resolve(process.cwd(), 'src/scripts/media', filename)

  try {
    const data = await fs.readFile(imagePath)
    return data.toString('binary')
  } catch (error) {
    throw new Error(`Failed to read image file "${filename}": ${error.message}`)
  }
}

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(
    Modules.FULFILLMENT
  )
  const salesChannelModuleService: ISalesChannelModuleService =
    container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService: IStoreModuleService = container.resolve(
    Modules.STORE
  )
  const hairPropsModuleService: HairPropsModuleService = container.resolve(
    'hairPropsModuleService'
  )

  const countries = ['za', 'bw', 'zm', 'mz', 'nm', 'ke', 'ug', 'rw']

  logger.info('Seeding store data...')
  const [store] = await storeModuleService.listStores()
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: 'Default Sales Channel',
  })

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: 'Online',
          },
          {
            name: 'In store',
          },
        ],
      },
    })
    defaultSalesChannel = salesChannelResult
  }

  logger.info('Seeding region data...')
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: 'South Africa',
          currency_code: 'zar',
          countries,
          payment_providers: ['pp_paystack_paystack'],
        },
        {
          name: 'South Africa',
          currency_code: 'zar',
          countries,
          payment_providers: ['pp_paystack_paystack'],
        },
      ],
    },
  })
  const region = regionResult[0]
  logger.info('Finished seeding regions.')

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: 'zar',
            is_default: true,
          },
          {
            currency_code: 'usd',
          },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
        default_region_id: region.id,
      },
    },
  })

  logger.info('Seeding tax regions...')
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
    })),
  })
  logger.info('Finished seeding tax regions.')

  logger.info('Seeding stock location data...')
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: 'Johannesburg',
          address: {
            city: 'Johannesburg',
            country_code: 'ZA',
            address_1: '',
          },
        },
      ],
    },
  })
  const stockLocation = stockLocationResult[0]

  await remoteLink.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: 'manual_manual',
    },
  })

  logger.info('Seeding fulfillment data...')
  const { result: shippingProfileResult } =
    await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: 'Postnet',
            type: 'default',
          },
        ],
      },
    })
  const shippingProfile = shippingProfileResult[0]

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: 'European Warehouse delivery',
    type: 'shipping',
    service_zones: [
      {
        name: 'South Africa',
        geo_zones: [
          {
            country_code: 'ZA',
            type: 'country',
          },
          {
            country_code: 'BW',
            type: 'country',
          },
          {
            country_code: 'ZM',
            type: 'country',
          },
          {
            country_code: 'MZ',
            type: 'country',
          },
          {
            country_code: 'NM',
            type: 'country',
          },
          {
            country_code: 'KE',
            type: 'country',
          },
          {
            country_code: 'UG',
            type: 'country',
          },
          {
            country_code: 'RW',
            type: 'country',
          },
        ],
      },
    ],
  })

  await remoteLink.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: 'Standard Shipping',
        price_type: 'flat',
        provider_id: 'manual_manual',
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: 'Standard (Postnet)',
          description: 'Ship in 2 working days.',
          code: 'standard',
        },
        prices: [
          {
            currency_code: 'ZAR',
            amount: 120,
          },
          {
            region_id: region.id,
            amount: 120,
          },
        ],
        rules: [
          {
            attribute: 'enabled_in_store',
            value: '"true"',
            operator: 'eq',
          },
          {
            attribute: 'is_return',
            value: 'false',
            operator: 'eq',
          },
        ],
      },
    ],
  })

  const pickupFulfillmentSet =
    await fulfillmentModuleService.createFulfillmentSets({
      name: 'Store pickup',
      type: 'pickup',
      service_zones: [
        {
          name: 'Store pickup (JHB)',
          geo_zones: [
            {
              country_code: 'ZA',
              type: 'country',
            },
            {
              country_code: 'ZA',
              type: 'country',
            },
          ],
        },
      ],
    })

  await remoteLink.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: pickupFulfillmentSet.id,
    },
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: 'JHB Store Pickup',
        price_type: 'flat',
        provider_id: 'manual_manual',
        service_zone_id: pickupFulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: 'JHB Store Pickup',
          description: 'Free in-store pickup.',
          code: 'standard',
        },
        prices: [
          {
            currency_code: 'zar',
            amount: 0,
          },
          {
            region_id: region.id,
            amount: 0,
          },
        ],
        rules: [
          {
            attribute: 'enabled_in_store',
            value: '"true"',
            operator: 'eq',
          },
          {
            attribute: 'is_return',
            value: 'false',
            operator: 'eq',
          },
        ],
      },
    ],
  })

  logger.info('Finished seeding fulfillment data.')

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  })
  logger.info('Finished seeding stock location data.')

  logger.info('Seeding publishable API key data...')
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: 'Webshop',
          type: 'publishable',
          created_by: '',
        },
      ],
    },
  })
  const publishableApiKey = publishableApiKeyResult[0]

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  })
  logger.info('Finished seeding publishable API key data.')

  logger.info('Seeding product data...')

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: 'Straight Hair',
          is_active: true,
        },
        {
          name: 'Curly Hair',
          is_active: true,
        },
        {
          name: 'Wavy Hair',
          is_active: true,
        },
        {
          name: 'Accessories',
          is_active: true,
        },
        {
          name: 'Hair Care',
          is_active: true,
        },
        {
          name: 'Bone Straight',
          is_active: true,
        },
      ],
    },
  })

  const [
    boneStraight1Image,
    straightHair1Image,
    curlyHair1Image,
    wavyHair1Image,
    hairCare1Image,
    hairAccessories1Image,
  ] = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'bone-straight-1.jpg',
            mimeType: 'image/jpg',
            content: await getImageFileContent(
              '/media/product-types/bone-straight/bone-straight-1.jpg'
            ),
          },
          {
            access: 'public',
            filename: 'straight-hair-1.jpg',
            mimeType: 'image/jpg',
            content: await getImageFileContent(
              '/media/product-types/straight/straight-hair-1.jpg'
            ),
          },
          {
            access: 'public',
            filename: 'curly-hair-1.jpg',
            mimeType: 'image/jpg',
            content: await getImageFileContent(
              '/media/product-types/curly/curly-hair-1.jpg'
            ),
          },
          {
            access: 'public',
            filename: 'wavy-hair-1.jpg',
            mimeType: 'image/jpg',
            content: await getImageFileContent(
              '/media/product-types/wavy/wavy-hair-1.jpg'
            ),
          },
          {
            access: 'public',
            filename: 'hair-care-1.png',
            mimeType: 'image/png',
            content: await getImageFileContent(
              '/media/product-types/care/hair-care-1.png'
            ),
          },
          {
            access: 'public',
            filename: 'hair-accessories-1.png',
            mimeType: 'image/png',
            content: await getImageFileContent(
              '/media/product-types/accessories/hair-accessories-1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  const { result: productTypes } = await createProductTypesWorkflow(
    container
  ).run({
    input: {
      product_types: [
        {
          value: 'Bone Straight',
          metadata: {
            image: boneStraight1Image,
          },
        },
        {
          value: 'Straight Hair',
          metadata: {
            image: straightHair1Image,
          },
        },
        {
          value: 'Curly Hair',
          metadata: {
            image: curlyHair1Image,
          },
        },
        {
          value: 'Wavy Hair',
          metadata: {
            image: wavyHair1Image,
          },
        },
        {
          value: 'Hair Care',
          metadata: {
            image: hairCare1Image,
          },
        },
        {
          value: 'Hair Accessories',
          metadata: {
            image: hairAccessories1Image,
          },
        },
      ],
    },
  })

  const [
    rawDonorImage,
    rawDonorCollectionPageImage,
    rawDonorProductPageImage,
    rawDonorProductPageWideImage,
    rawDonorProductPageCtaImage,
    pureDonorImage,
    pureDonorCollectionPageImage,
    pureDonorProductPageImage,
    pureDonorProductPageWideImage,
    pureDonorProductPageCtaImage,
    babyDonorImage,
    babyDonorCollectionPageImage,
    babyDonorProductPageImage,
    babyDonorProductPageWideImage,
    babyDonorProductPageCtaImage,
    theAugmentImage,
    theAugmentCollectionPageImage,
    theAugmentProductPageImage,
    theAugmentProductPageWideImage,
    theAugmentProductPageCtaImage,
  ] = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'raw-donor.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/raw-donor/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'raw-donor-collection-page-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/raw-donor/collection_page_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'raw-donor-product-page-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/raw-donor/product_page_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'raw-donor-product-page-wide-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/raw-donor/product_page_wide_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'raw-donor-product-page-cta-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/raw-donor/product_page_cta_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'pure-donor.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/pure-donor/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'pure-donor-collection-page-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/pure-donor/collection_page_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'pure-donor-product-page-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/pure-donor/product_page_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'pure-donor-product-page-wide-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/pure-donor/product_page_wide_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'pure-donor-product-page-cta-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/pure-donor/product_page_cta_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'baby-donor.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/baby-donor/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'baby-donor-collection-page-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/baby-donor/collection_page_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'baby-donor-product-page-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/baby-donor/product_page_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'baby-donor-product-page-wide-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/baby-donor/product_page_wide_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'baby-donor-product-page-cta-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/baby-donor/product_page_cta_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'the-augment.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/the-augment/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'the-augment-collection-page-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/the-augment/collection_page_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'the-augment-product-page-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/the-augment/product_page_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'the-augment-product-page-wide-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/the-augment/product_page_wide_image.png'
            ),
          },
          {
            access: 'public',
            filename: 'the-augment-product-page-cta-image.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              '/media/collections/the-augment/product_page_cta_image.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  const { result: collections } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: [
        {
          title: 'Raw Donor',
          handle: 'raw-donor',
          metadata: {
            description:
              'Minimalistic designs, neutral colors, and high-quality textures',
            image: rawDonorImage,
            collection_page_image: rawDonorCollectionPageImage,
            collection_page_heading:
              'Raw Donor: Effortless elegance, timeless comfort',
            collection_page_content: `Minimalistic designs, neutral colors, and high-quality textures. Perfect for those who seek comfort with a clean and understated aesthetic.

This collection brings the essence of Scandinavian elegance to your living room.`,
            product_page_heading: 'Collection Inspired Interior',
            product_page_image: rawDonorProductPageImage,
            product_page_wide_image: rawDonorProductPageWideImage,
            product_page_cta_image: rawDonorProductPageCtaImage,
            product_page_cta_heading:
              "The 'Name of sofa' embodies Scandinavian minimalism with clean lines and a soft, neutral palette.",
            product_page_cta_link: 'See more out of ‘Raw Donor’ collection',
          },
        },
        {
          title: 'Pure Donor',
          handle: 'pure-donor',
          metadata: {
            description:
              'Sophisticated and sleek, these sofas blend modern design with luxurious comfort',
            image: pureDonorImage,
            collection_page_image: pureDonorCollectionPageImage,
            collection_page_heading:
              'Pure Donor: Where modern design meets luxurious living',
            collection_page_content: `Sophisticated and sleek, these sofas blend modern design with luxurious comfort. Bold lines and premium materials create the ultimate statement pieces for any contemporary home.

Elevate your space with timeless beauty.`,
            product_page_heading: 'Collection Inspired Interior',
            product_page_image: pureDonorProductPageImage,
            product_page_wide_image: pureDonorProductPageWideImage,
            product_page_cta_image: pureDonorProductPageCtaImage,
            product_page_cta_heading:
              "The 'Name of sofa' is a masterpiece of minimalism and luxury.",
            product_page_cta_link: 'See more out of ‘Pure Donor’ collection',
          },
        },
        {
          title: 'Baby Donor',
          handle: 'baby-donor',
          metadata: {
            description:
              'Infused with playful textures and vibrant patterns with eclectic vibes',
            image: babyDonorImage,
            collection_page_image: babyDonorCollectionPageImage,
            collection_page_heading:
              'Baby Donor: Relaxed, eclectic style with a touch of free-spirited charm',
            collection_page_content: `Infused with playful textures and vibrant patterns, this collection embodies relaxed, eclectic vibes. Soft fabrics and creative designs add warmth and personality to any room.

It’s comfort with a bold, carefree spirit.`,
            product_page_heading: 'Collection Inspired Interior',
            product_page_image: babyDonorProductPageImage,
            product_page_wide_image: babyDonorProductPageWideImage,
            product_page_cta_image: babyDonorProductPageCtaImage,
            product_page_cta_heading:
              "The 'Name of sofa' captures the essence of boho style with its relaxed, oversized form and eclectic fabric choices.",
            product_page_cta_link: 'See more out of ‘Baby Donor’ collection',
          },
        },
        {
          title: 'The Augment',
          handle: 'the-augment',
          metadata: {
            description:
              'Augmented reality technology, interactive design, and unique features',
            image: theAugmentImage,
            collection_page_image: theAugmentCollectionPageImage,
            collection_page_heading:
              'The Augment: Where augmented reality meets interactive design',
            collection_page_content: `Augmented reality technology, interactive design, and unique features. This collection brings the future of furniture design to life. It’s a space where technology meets creativity.`,
            product_page_heading: 'Collection Inspired Interior',
            product_page_image: theAugmentProductPageImage,
            product_page_wide_image: theAugmentProductPageWideImage,
            product_page_cta_image: theAugmentProductPageCtaImage,
            product_page_cta_heading:
              "The 'Name of sofa' is a masterpiece of augmented reality technology.",
            product_page_cta_link: 'See more out of ‘The Augment’ collection',
          },
        },
      ],
    },
  })

  const productLengths: ProductLengthModelType[] =
    await hairPropsModuleService.createProductLengths([
      {
        name: '8"',
      },
      {
        name: '10"',
      },
      {
        name: '12"',
      },
      {
        name: '14"',
      },
      {
        name: '16"',
      },
      {
        name: '18"',
      },
      {
        name: '20"',
      },
      {
        name: '22"',
      },
      {
        name: '24"',
      },
      {
        name: '26"',
      },
      {
        name: '28"',
      },
      {
        name: '30"',
      },
    ])

  await hairPropsModuleService.createCapSizes([
    //XS
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '8"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '10"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '12"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '14"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '16"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '18"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '20"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '22"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '24"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '26"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '28"').id,
    },
    {
      name: 'Xs',
      product_length_id: productLengths.find((m) => m.name === '30"').id,
    },
    //sm
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '8"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '10"').id,
    },

    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '12"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '14"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '16"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '18"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '20"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '22"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '24"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '26"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '28"').id,
    },
    {
      name: 'Sm',
      product_length_id: productLengths.find((m) => m.name === '30"').id,
    },
    //Medium
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '8"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '10"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '12"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '14"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '16"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '18"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '20"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '22"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '24"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '26"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '28"').id,
    },
    {
      name: 'Md',
      product_length_id: productLengths.find((m) => m.name === '30"').id,
    },
    //Large
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '8"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '10"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '12"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '14"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '16"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '18"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '20"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '22"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '24"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '26"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '28"').id,
    },
    {
      name: 'Lg',
      product_length_id: productLengths.find((m) => m.name === '30"').id,
    },
    //Xl
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '8"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '10"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '12"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '14"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '16"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '18"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '20"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '22"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '24"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '26"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '28"').id,
    },
    {
      name: 'Xl',
      product_length_id: productLengths.find((m) => m.name === '30"').id,
    },
  ])

  const astridCurveImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'astrid-curve.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/astrid-curve/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'astrid-curve-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/astrid-curve/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Astrid Curve',
          handle: 'astrid-curve',
          description:
            'The Astrid Curve combines flowing curves and cozy, textured fabric for a truly bohemian vibe. Its relaxed design adds character and comfort, perfect for eclectic living spaces with a free-spirited charm.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Curly Hair').id,
          ],
          collection_id: collections.find((c) => c.handle === 'boho-chic').id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: astridCurveImages,
          options: [
            {
              title: 'Material',
              values: ['Microfiber', 'Velvet'],
            },
            {
              title: 'Color',
              values: ['Dark Gray', 'Purple'],
            },
          ],
          variants: [
            {
              title: 'Microfiber / Dark Gray',
              sku: 'ASTRID-CURVE-MICROFIBER-DARK-GRAY',
              options: {
                Material: 'Microfiber',
                Color: 'Dark Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Velvet / Purple',
              sku: 'ASTRID-CURVE-VELVET-PURPLE',
              options: {
                Material: 'Velvet',
                Color: 'Purple',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const belimeEstateImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'belime-estate.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/belime-estate/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'belime-estate-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/belime-estate/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Belime Estate',
          handle: 'belime-estate',
          description:
            'The Belime Estate exudes classic sophistication with its tufted back and rich fabric. Its luxurious look and enduring comfort make it a perfect fit for traditional, elegant interiors.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Two seater').id,
          ],
          collection_id: collections.find(
            (c) => c.handle === 'timeless-classics'
          ).id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: belimeEstateImages,
          options: [
            {
              title: 'Material',
              values: ['Linen', 'Boucle'],
            },
            {
              title: 'Color',
              values: ['Red', 'Blue', 'Beige'],
            },
          ],
          variants: [
            {
              title: 'Linen / Red',
              sku: 'BELIME-ESTATE-LINEN-RED',
              options: {
                Material: 'Linen',
                Color: 'Red',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Linen / Blue',
              sku: 'BELIME-ESTATE-LINEN-BLUE',
              options: {
                Material: 'Linen',
                Color: 'Blue',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / Beige',
              sku: 'BELIME-ESTATE-BOUCLE-BEIGE',
              options: {
                Material: 'Boucle',
                Color: 'Beige',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const cypressRetreatImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'cypress-retreat.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/cypress-retreat/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'cypress-retreat-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/cypress-retreat/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Cypress Retreat',
          handle: 'cypress-retreat',
          description:
            'The Cypress Retreat is a nod to traditional design with its elegant lines and durable, high-quality upholstery. A timeless choice, it offers long-lasting comfort and a refined aesthetic for any home.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Three seater').id,
          ],
          collection_id: collections.find(
            (c) => c.handle === 'timeless-classics'
          ).id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: cypressRetreatImages,
          options: [
            {
              title: 'Material',
              values: ['Leather'],
            },
            {
              title: 'Color',
              values: ['Beige', 'Violet'],
            },
          ],
          variants: [
            {
              title: 'Leather / Beige',
              sku: 'CYPRESS-RETREAT-LEATHER-BEIGE',
              options: {
                Material: 'Leather',
                Color: 'Beige',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Leather / Violet',
              sku: 'CYPRESS-RETREAT-LEATHER-VIOLET',
              options: {
                Material: 'Leather',
                Color: 'Violet',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const everlyEstateImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'everly-estate.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/everly-estate/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'everly-estate-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/everly-estate/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Everly Estate',
          handle: 'everly-estate',
          description:
            'The Everly Estate offers a blend of modern elegance and plush luxury, with its sleek lines and soft velvet upholstery. Perfect for upscale interiors, it exudes sophistication and comfort in equal measure.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Two seater').id,
          ],
          collection_id: collections.find((c) => c.handle === 'modern-luxe').id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: everlyEstateImages,
          options: [
            {
              title: 'Material',
              values: ['Microfiber', 'Velvet'],
            },
            {
              title: 'Color',
              values: ['Orange', 'Black'],
            },
          ],
          variants: [
            {
              title: 'Microfiber / Orange',
              sku: 'EVERLY-ESTATE-MICROFIBER-ORANGE',
              options: {
                Material: 'Microfiber',
                Color: 'Orange',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Velvet / Black',
              sku: 'EVERLY-ESTATE-VELVET-BLACK',
              options: {
                Material: 'Velvet',
                Color: 'Black',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const havenhillEstateImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'havenhill-estate.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/havenhill-estate/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'havenhill-estate-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/havenhill-estate/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Havenhill Estate',
          handle: 'havenhill-estate',
          description:
            'The Havenhill Estate brings a touch of traditional charm with its elegant curves and classic silhouette. Upholstered in durable, luxurious fabric, it’s a timeless piece that combines comfort and style, fitting seamlessly into any sophisticated home.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'One seater').id,
          ],
          collection_id: collections.find(
            (c) => c.handle === 'timeless-classics'
          ).id,
          type_id: productTypes.find((pt) => pt.value === 'Arm Chairs').id,
          status: ProductStatus.PUBLISHED,
          images: havenhillEstateImages,
          options: [
            {
              title: 'Material',
              values: ['Linen', 'Boucle'],
            },
            {
              title: 'Color',
              values: ['Green', 'Light Gray', 'Yellow'],
            },
          ],
          variants: [
            {
              title: 'Linen / Green',
              sku: 'HAVENHILL-ESTATE-LINEN-GREEN',
              options: {
                Material: 'Linen',
                Color: 'Green',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1000,
                  currency_code: 'eur',
                },
                {
                  amount: 1200,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / Light Gray',
              sku: 'HAVENHILL-ESTATE-BOUCLE-LIGHT-GRAY',
              options: {
                Material: 'Boucle',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1200,
                  currency_code: 'eur',
                },
                {
                  amount: 1400,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const monacoFlairImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'monaco-flair.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/monaco-flair/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'monaco-flair-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/monaco-flair/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Monaco Flair',
          handle: 'monaco-flair',
          description:
            'The Monaco Flair combines sleek metallic accents with rich fabric, delivering a bold, luxurious statement. Its minimalist design and deep seating make it a standout piece for modern living rooms.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Three seater').id,
          ],
          collection_id: collections.find((c) => c.handle === 'modern-luxe').id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: monacoFlairImages,
          options: [
            {
              title: 'Material',
              values: ['Linen', 'Boucle'],
            },
            {
              title: 'Color',
              values: ['Green', 'Light Gray', 'Beige'],
            },
          ],
          variants: [
            {
              title: 'Linen / Green',
              sku: 'MONACO-FLAIR-LINEN-GREEN',
              options: {
                Material: 'Linen',
                Color: 'Green',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / Light Gray',
              sku: 'MONACO-FLAIR-BOUCLE-LIGHT-GRAY',
              options: {
                Material: 'Boucle',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / Beige',
              sku: 'MONACO-FLAIR-BOUCLE-BEIGE',
              options: {
                Material: 'Boucle',
                Color: 'Beige',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const nordicBreezeImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'nordic-breeze.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/nordic-breeze/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'nordic-breeze-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/nordic-breeze/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Nordic Breeze',
          handle: 'nordic-breeze',
          description:
            'The Nordic Breeze is a refined expression of Scandinavian minimalism, with its crisp silhouette and airy aesthetic. Crafted for both comfort and simplicity, it’s perfect for creating a serene living space.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'One seater').id,
          ],
          collection_id: collections.find(
            (c) => c.handle === 'scandinavian-simplicity'
          ).id,
          type_id: productTypes.find((pt) => pt.value === 'Arm Chairs').id,
          status: ProductStatus.PUBLISHED,
          images: nordicBreezeImages,
          options: [
            {
              title: 'Material',
              values: ['Boucle', 'Linen'],
            },
            {
              title: 'Color',
              values: ['Beige', 'White', 'Light Gray'],
            },
          ],
          variants: [
            {
              title: 'Boucle / Beige',
              sku: 'NORDIC-BREEZE-BOUCLE-BEIGE',
              options: {
                Material: 'Boucle',
                Color: 'Beige',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1200,
                  currency_code: 'eur',
                },
                {
                  amount: 1400,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / White',
              sku: 'NORDIC-BREEZE-BOUCLE-WHITE',
              options: {
                Material: 'Boucle',
                Color: 'White',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1200,
                  currency_code: 'eur',
                },
                {
                  amount: 1400,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Linen / Light Gray',
              sku: 'NORDIC-BREEZE-LINEN-LIGHT-GRAY',
              options: {
                Material: 'Linen',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1800,
                  currency_code: 'eur',
                },
                {
                  amount: 2000,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const nordicHavenImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'nordic-haven.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/nordic-haven/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'nordic-haven-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/nordic-haven/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Nordic Haven',
          handle: 'nordic-haven',
          description:
            'The Nordic Haven features clean lines and soft textures, embodying the essence of Scandinavian design. Its natural tones and minimalist frame bring effortless serenity and comfort to any home.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Three seater').id,
          ],
          collection_id: collections.find(
            (c) => c.handle === 'scandinavian-simplicity'
          ).id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: nordicHavenImages,
          options: [
            {
              title: 'Material',
              values: ['Linen', 'Boucle'],
            },
            {
              title: 'Color',
              values: ['Light Gray', 'White', 'Beige'],
            },
          ],
          variants: [
            {
              title: 'Linen / Light Gray',
              sku: 'NORDIC-HAVEN-LINEN-LIGHT-GRAY',
              options: {
                Material: 'Linen',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / White',
              sku: 'NORDIC-HAVEN-BOUCLE-WHITE',
              options: {
                Material: 'Boucle',
                Color: 'White',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / Beige',
              sku: 'NORDIC-HAVEN-BOUCLE-BEIGE',
              options: {
                Material: 'Boucle',
                Color: 'Beige',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const osloDriftImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'oslo-drift.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/oslo-drift/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'oslo-drift-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/oslo-drift/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Oslo Drift',
          handle: 'oslo-drift',
          description:
            'The Oslo Drift is designed for ultimate relaxation, with soft, supportive cushions and a sleek, modern frame. Its understated elegance and neutral tones make it an ideal fit for contemporary, minimalist homes.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Two seater').id,
          ],
          collection_id: collections.find(
            (c) => c.handle === 'scandinavian-simplicity'
          ).id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: osloDriftImages,
          options: [
            {
              title: 'Material',
              values: ['Boucle', 'Linen'],
            },
            {
              title: 'Color',
              values: ['White', 'Beige', 'Light Gray'],
            },
          ],
          variants: [
            {
              title: 'Boucle / White',
              sku: 'OSLO-DRIFT-BOUCLE-WHITE',
              options: {
                Material: 'Boucle',
                Color: 'White',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / Beige',
              sku: 'OSLO-DRIFT-BOUCLE-BEIGE',
              options: {
                Material: 'Boucle',
                Color: 'Beige',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Linen / Light Gray',
              sku: 'OSLO-DRIFT-LINEN-LIGHT-GRAY',
              options: {
                Material: 'Linen',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const osloSerenityImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'oslo-serenity.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/oslo-serenity/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'oslo-serenity-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/oslo-serenity/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Oslo Serenity',
          handle: 'oslo-serenity',
          description:
            'The Oslo Serenity embodies Scandinavian minimalism with clean lines and a soft, neutral palette. Its tailored silhouette and plush cushions deliver a balance of simplicity and comfort, making it perfect for those who value understated elegance.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Two seater').id,
          ],
          collection_id: collections.find(
            (c) => c.handle === 'scandinavian-simplicity'
          ).id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: osloSerenityImages,
          options: [
            {
              title: 'Material',
              values: ['Leather'],
            },
            {
              title: 'Color',
              values: ['Violet', 'Beige'],
            },
          ],
          variants: [
            {
              title: 'Leather / Violet',
              sku: 'OSLO-SERENITY-LEATHER-VIOLET',
              options: {
                Material: 'Leather',
                Color: 'Violet',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Leather / Beige',
              sku: 'OSLO-SERENITY-LEATHER-BEIGE',
              options: {
                Material: 'Leather',
                Color: 'Beige',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const palomaHavenImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'paloma-haven.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/paloma-haven/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'paloma-haven-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/paloma-haven/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Paloma Haven',
          handle: 'paloma-haven',
          description:
            'Minimalistic designs, neutral colors, and high-quality textures. Perfect for those who seek comfort with a clean and understated aesthetic. This collection brings the essence of Scandinavian elegance to your living room.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'One seater').id,
          ],
          collection_id: collections.find((c) => c.handle === 'modern-luxe').id,
          type_id: productTypes.find((pt) => pt.value === 'Arm Chairs').id,
          status: ProductStatus.PUBLISHED,
          images: palomaHavenImages,
          options: [
            {
              title: 'Material',
              values: ['Linen', 'Boucle'],
            },
            {
              title: 'Color',
              values: ['Light Gray', 'Green', 'Beige'],
            },
          ],
          variants: [
            {
              title: 'Linen / Light Gray',
              sku: 'PALOMA-HAVEN-LINEN-LIGHT-GRAY',
              options: {
                Material: 'Linen',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 900,
                  currency_code: 'eur',
                },
                {
                  amount: 1100,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Linen / Green',
              sku: 'PALOMA-HAVEN-LINEN-GREEN',
              options: {
                Material: 'Linen',
                Color: 'Green',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 900,
                  currency_code: 'eur',
                },
                {
                  amount: 1100,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / Beige',
              sku: 'PALOMA-HAVEN-BOUCLE-BEIGE',
              options: {
                Material: 'Boucle',
                Color: 'Beige',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1200,
                  currency_code: 'eur',
                },
                {
                  amount: 1400,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const savannahGroveImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'savannah-grove.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/savannah-grove/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'savannah-grove-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/savannah-grove/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Savannah Grove',
          handle: 'savannah-grove',
          description:
            'The Savannah Grove captures the essence of boho style with its relaxed, oversized form and eclectic fabric choices. Designed for both comfort and personality, it’s the ideal piece for those who seek a cozy, free-spirited vibe in their living spaces.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'One seater').id,
          ],
          collection_id: collections.find((c) => c.handle === 'boho-chic').id,
          type_id: productTypes.find((pt) => pt.value === 'Arm Chairs').id,
          status: ProductStatus.PUBLISHED,
          images: savannahGroveImages,
          options: [
            {
              title: 'Material',
              values: ['Boucle', 'Linen'],
            },
            {
              title: 'Color',
              values: ['Light Gray', 'Yellow'],
            },
          ],
          variants: [
            {
              title: 'Boucle / Light Gray',
              sku: 'SAVANNAH-GROVE-BOUCLE-LIGHT-GRAY',
              options: {
                Material: 'Boucle',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1200,
                  currency_code: 'eur',
                },
                {
                  amount: 1400,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Linen / Yellow',
              sku: 'SAVANNAH-GROVE-LINEN-YELLOW',
              options: {
                Material: 'Linen',
                Color: 'Yellow',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 900,
                  currency_code: 'eur',
                },
                {
                  amount: 1100,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Linen / Light Gray',
              sku: 'SAVANNAH-GROVE-LINEN-LIGHT-GRAY',
              options: {
                Material: 'Linen',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 900,
                  currency_code: 'eur',
                },
                {
                  amount: 1100,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const serenaMeadowImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'serena-meadow.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/serena-meadow/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'serena-meadow-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/serena-meadow/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Serena Meadow',
          handle: 'serena-meadow',
          description:
            'The Serena Meadow combines a classic silhouette with modern comfort, offering a relaxed yet polished look. Its soft upholstery and subtle curves bring a timeless elegance to any living room.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Two seater').id,
          ],
          collection_id: collections.find(
            (c) => c.handle === 'timeless-classics'
          ).id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: serenaMeadowImages,
          options: [
            {
              title: 'Material',
              values: ['Microfiber', 'Velvet'],
            },
            {
              title: 'Color',
              values: ['Black', 'Dark Gray'],
            },
          ],
          variants: [
            {
              title: 'Microfiber / Black',
              sku: 'SERENA-MEADOW-MICROFIBER-BLACK',
              options: {
                Material: 'Microfiber',
                Color: 'Black',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Microfiber / Dark Gray',
              sku: 'SERENA-MEADOW-MICROFIBER-DARK-GRAY',
              options: {
                Material: 'Microfiber',
                Color: 'Dark Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Velvet / Black',
              sku: 'SERENA-MEADOW-VELVET-BLACK',
              options: {
                Material: 'Velvet',
                Color: 'Black',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const suttonRoyaleImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'sutton-royale.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/sutton-royale/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'sutton-royale-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/sutton-royale/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Sutton Royale',
          handle: 'sutton-royale',
          description:
            'The Sutton Royale blends eclectic design with classic bohemian comfort, featuring soft, tufted fabric and a wide, welcoming frame. Its unique style adds a touch of vintage flair to any space.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Two seater').id,
          ],
          collection_id: collections.find((c) => c.handle === 'boho-chic').id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: suttonRoyaleImages,
          options: [
            {
              title: 'Material',
              values: ['Velvet', 'Microfiber'],
            },
            {
              title: 'Color',
              values: ['Purple', 'Dark Gray'],
            },
          ],
          variants: [
            {
              title: 'Velvet / Purple',
              sku: 'SUTTON-ROYALE-VELVET-PURPLE',
              options: {
                Material: 'Velvet',
                Color: 'Purple',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Microfiber / Dark Gray',
              sku: 'SUTTON-ROYALE-MICROFIBER-DARK-GRAY',
              options: {
                Material: 'Microfiber',
                Color: 'Dark Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const velarLoftImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'velar-loft.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/velar-loft/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'velar-loft-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/velar-loft/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Velar Loft',
          handle: 'velar-loft',
          description:
            'The Velar Loft offers a refined blend of modern design and opulent comfort. Upholstered in rich fabric with sleek metallic accents, this sofa delivers both luxury and a contemporary edge, making it a striking centerpiece for sophisticated interiors.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'One seater').id,
          ],
          collection_id: collections.find((c) => c.handle === 'modern-luxe').id,
          type_id: productTypes.find((pt) => pt.value === 'Arm Chairs').id,
          status: ProductStatus.PUBLISHED,
          images: velarLoftImages,
          options: [
            {
              title: 'Material',
              values: ['Velvet', 'Microfiber'],
            },
            {
              title: 'Color',
              values: ['Black', 'Orange'],
            },
          ],
          variants: [
            {
              title: 'Velvet / Black',
              sku: 'VELAR-LOFT-VELVET-BLACK',
              options: {
                Material: 'Velvet',
                Color: 'Black',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1300,
                  currency_code: 'eur',
                },
                {
                  amount: 1500,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Microfiber / Orange',
              sku: 'VELAR-LOFT-MICROFIBER-ORANGE',
              options: {
                Material: 'Microfiber',
                Color: 'Orange',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1100,
                  currency_code: 'eur',
                },
                {
                  amount: 1300,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  const veloraLuxeImages = await uploadFilesWorkflow(container)
    .run({
      input: {
        files: [
          {
            access: 'public',
            filename: 'velora-luxe.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/velora-luxe/image.png'
            ),
          },
          {
            access: 'public',
            filename: 'velora-luxe-2.png',
            mimeType: 'image/png',
            content: await getImageUrlContent(
              'https://assets.agilo.com/fashion-starter/products/velora-luxe/image1.png'
            ),
          },
        ],
      },
    })
    .then((res) => res.result)

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Velora Luxe',
          handle: 'velora-luxe',
          description:
            'The Velora Luxe brings a touch of luxury to bohemian design with its bold patterns and plush comfort. Its oversized shape and inviting cushions make it an ideal centerpiece for laid-back, stylish interiors.',
          category_ids: [
            categoryResult.find((cat) => cat.name === 'Three seater').id,
          ],
          collection_id: collections.find((c) => c.handle === 'boho-chic').id,
          type_id: productTypes.find((pt) => pt.value === 'Sofas').id,
          status: ProductStatus.PUBLISHED,
          images: veloraLuxeImages,
          options: [
            {
              title: 'Material',
              values: ['Linen', 'Boucle'],
            },
            {
              title: 'Color',
              values: ['Yellow', 'Light Gray'],
            },
          ],
          variants: [
            {
              title: 'Linen / Yellow',
              sku: 'VELORA-LUXE-LINEN-YELLOW',
              options: {
                Material: 'Linen',
                Color: 'Yellow',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 1500,
                  currency_code: 'eur',
                },
                {
                  amount: 1700,
                  currency_code: 'usd',
                },
              ],
            },
            {
              title: 'Boucle / Light Gray',
              sku: 'VELORA-LUXE-BOUCLE-LIGHT-GRAY',
              options: {
                Material: 'Boucle',
                Color: 'Light Gray',
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 2000,
                  currency_code: 'eur',
                },
                {
                  amount: 2200,
                  currency_code: 'usd',
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  })

  logger.info('Finished seeding product data.')
}
