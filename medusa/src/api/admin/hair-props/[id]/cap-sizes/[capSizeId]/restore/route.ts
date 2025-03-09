import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import HairPropsModuleService from '../../../../../../../modules/hair-props/service'
import { HAIR_PROPS_MODULE } from '../../../../../../../modules/hair-props'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  await hairPropsModuleService.retrieveProductLength(req.params.id, {
    withDeleted: true,
  })

  await hairPropsModuleService.restoreCapSize(req.params.colorId)

  const capSize = await hairPropsModuleService.retrieveCapSize(
    req.params.colorId,
    {
      withDeleted: true,
    }
  )

  res.status(200).json(capSize)
}
