import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { z } from 'zod'
import HairPropsModuleService from '../../../../modules/hair-props/service'
import { HAIR_PROPS_MODULE } from '../../../../modules/hair-props'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  const productLength = await hairPropsModuleService.retrieveProductLength(
    req.params.id,
    {
      relations: ['capSizes'],
      withDeleted: true,
    }
  )

  res.status(200).json(productLength)
}

const updateMaterialBodySchema = z.object({
  name: z.string().min(1),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const validatedData = updateMaterialBodySchema.parse(body)

  const productLength = await hairPropsModuleService.updateProductLength({
    ...validatedData,
    id: req.params.id,
  })

  res.status(200).json(productLength)
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  await hairPropsModuleService.softDeleteProductLength(req.params.id)

  const productLength = await hairPropsModuleService.retrieveProductLength(
    req.params.id,
    {
      relations: ['capSizes'],
      withDeleted: true,
    }
  )

  res.status(200).json(productLength)
}
