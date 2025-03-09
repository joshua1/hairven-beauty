import { z } from 'zod'
import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import HairPropsModuleService from '../../../modules/hair-props/service'
import { HAIR_PROPS_MODULE } from '../../../modules/hair-props'

const productLengthsListQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  deleted: z.coerce.boolean().optional().default(false),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { page, deleted } = productLengthsListQuerySchema.parse(req.query)

  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  const [productLengths, count] =
    await hairPropsModuleService.listAndCountProductLengths(
      deleted
        ? {
            deleted_at: { $lte: new Date() },
          }
        : undefined,
      {
        skip: 20 * (page - 1),
        take: 20,
        withDeleted: deleted,
        relations: ['colors'],
      }
    )

  const last_page = Math.ceil(count / 20)

  res.status(200).json({ productLengths, count, page, last_page })
}

const createProductLengthBodySchema = z.object({
  name: z.string().min(1),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const hairPropsModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const validatedData = createProductLengthBodySchema.parse(body)

  const productLength = await hairPropsModuleService.createProductLength(
    validatedData
  )

  res.status(201).json(productLength)
}
