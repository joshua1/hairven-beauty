import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { IProductModuleService } from '@medusajs/framework/types'
import { HAIR_PROPS_MODULE } from '../../../../../modules/hair-props'
import HairPropsModuleService from '../../../../../modules/hair-props/service'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productModuleService: IProductModuleService = req.scope.resolve(
    Modules.PRODUCT
  )
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  const product = await productModuleService.retrieveProduct(req.params.id, {
    relations: ['options', 'variants', 'variants.options'],
  })

  const productLengthOption = product.options.find(
    (option) => option.title === 'Product Length'
  )
  const capSizeOption = product.options.find(
    (option) => option.title === 'Cap Size'
  )

  const productLengthsAndCapSizeNamesTree = new Map<string, string[]>()

  for (const productVariant of product.variants) {
    const productLengthName = productVariant.options.find(
      (option) => option.option_id === productLengthOption.id
    )?.value

    if (!productLengthName) {
      continue
    }

    const capSizeNames = productVariant.options
      .filter((option) => option.option_id === capSizeOption.id)
      .map((option) => option.value)

    if (!productLengthsAndCapSizeNamesTree.has(productLengthName)) {
      productLengthsAndCapSizeNamesTree.set(productLengthName, capSizeNames)
    } else {
      const existingCapSizeNames =
        productLengthsAndCapSizeNamesTree.get(productLengthName)

      productLengthsAndCapSizeNamesTree.set(
        productLengthName,
        Array.from(new Set([...existingCapSizeNames, ...capSizeNames]))
      )
    }
  }

  const productLengths = await hairPropsModuleService.listProductLengths(
    {
      name: Array.from(productLengthsAndCapSizeNamesTree.keys()),
    },
    {
      relations: ['cap_sizes'],
    }
  )

  res.status(200).json({
    missing_product_lengths: Array.from(
      productLengthsAndCapSizeNamesTree.keys()
    ).filter((productLengthName) =>
      productLengths.every(
        (productLength) => productLength.name !== productLengthName
      )
    ),
    productLengths: productLengths.map((productLength) => ({
      ...productLength,
      cap_sizes: productLength.capSizes.filter((capSize) =>
        productLengthsAndCapSizeNamesTree
          .get(productLength.name)
          .includes(capSize.name)
      ),
      missing_capSizes: productLengthsAndCapSizeNamesTree
        .get(productLength.name)
        .filter((capSizeName) =>
          productLength.capSizes.every(
            (capSize) => capSize.name !== capSizeName
          )
        ),
    })),
  })
}
