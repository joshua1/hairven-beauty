import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { z } from 'zod'
import HairPropsModuleService from '../../../../../../modules/hair-props/service'
import { HAIR_PROPS_MODULE } from '../../../../../../modules/hair-props'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  await hairPropsModuleService.retrieveProductLength(req.params.id, {
    withDeleted: true,
  })

  const capSize = await hairPropsModuleService.retrieveCapSize(
    req.params.colorId,
    {
      withDeleted: true,
    }
  )

  res.status(200).json(capSize)
}

const capSizesUpdateBodySchema = z.object({
  name: z.string().min(1),
  hex_code: z
    .string()
    .min(1)
    .transform((val) => val.toUpperCase())
    .refine((val) => /^#([A-F0-9]{6}|[A-F0-9]{3})$/.test(val), {
      message: 'Invalid hex code',
    }),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  await hairPropsModuleService.retrieveProductLength(req.params.id, {
    withDeleted: true,
  })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const validatedData = capSizesUpdateBodySchema.parse(body)

  const capSize = await hairPropsModuleService.updateCapSize({
    ...validatedData,
    id: req.params.colorId,
  })

  res.status(200).json(capSize)
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  await hairPropsModuleService.retrieveProductLength(req.params.id, {
    withDeleted: true,
  })

  await hairPropsModuleService.softDeleteCapSize(req.params.colorId)

  const capSize = await hairPropsModuleService.retrieveCapSize(
    req.params.colorId,
    {
      withDeleted: true,
    }
  )

  res.status(200).json(capSize)
}
