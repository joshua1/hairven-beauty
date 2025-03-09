import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import HairPropsModuleService from '../../../../../modules/hair-props/service'
import { HAIR_PROPS_MODULE } from '../../../../../modules/hair-props'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  await hairPropsModuleService.restoreProductLength(req.params.id)

  const productLength = await hairPropsModuleService.retrieveProductLength(
    req.params.id,
    {
      relations: ['capSizes'],
      withDeleted: true,
    }
  )

  res.status(200).json(productLength)
}
