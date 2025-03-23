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

  const [product] = await productModuleService.listProducts(
    {
      handle: req.params.productHandle,
    },
    {
      relations: ['options', 'variants', 'variants.options'],
      take: 1,
    }
  )

  const productLengthOption = product.options.find(
    (option) => option.title === 'Product Length'
  )
  const capSizeOption = product.options.find(
    (option) => option.title === 'Cap Size'
  )

  if (!productLengthOption || !capSizeOption) {
    res.status(200).json({
      productLengths: [],
    })
    return
  }

  const productLengthsAndCapSizesNamesTree = new Map<string, string[]>()

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

    if (!productLengthsAndCapSizesNamesTree.has(productLengthName)) {
      productLengthsAndCapSizesNamesTree.set(productLengthName, capSizeNames)
    } else {
      const existingCapSizeNames =
        productLengthsAndCapSizesNamesTree.get(productLengthName)

      productLengthsAndCapSizesNamesTree.set(
        productLengthName,
        Array.from(new Set([...existingCapSizeNames, ...capSizeNames]))
      )
    }
  }

  const productLengths = await hairPropsModuleService.listProductLengths(
    {
      name: Array.from(productLengthsAndCapSizesNamesTree.keys()),
    },
    {
      relations: ['cap_sizes'],
    }
  )

  res.status(200).json({
    productLengths: productLengths.map((productLength) => ({
      id: productLength.id,
      name: productLength.name,
      cap_sizes: productLength.capSizes
        .filter((capSize) =>
          productLengthsAndCapSizesNamesTree
            .get(productLength.name)
            .includes(capSize.name)
        )
        .map((capSize) => ({
          id: capSize.id,
          name: capSize.name,
        })),
    })),
  })
}
