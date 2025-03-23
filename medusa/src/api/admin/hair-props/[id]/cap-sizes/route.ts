import { z } from 'zod'
import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import HairPropsModuleService from '../../../../../modules/hair-props/service'
import { HAIR_PROPS_MODULE } from '../../../../../modules/hair-props'

const capSizesListQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  deleted: z.coerce.boolean().optional().default(false),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { page, deleted } = capSizesListQuerySchema.parse(req.query)

  const fashionModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  const [capSizes, count] = await fashionModuleService.listAndCountCapSizes(
    deleted
      ? {
          deleted_at: { $lte: new Date() },
          product_length_id: req.params.id,
        }
      : {
          product_length_id: req.params.id,
        },
    {
      skip: 20 * (page - 1),
      take: 20,
      withDeleted: deleted,
    }
  )

  const last_page = Math.ceil(count / 20)

  res.status(200).json({ capSizes, count, page, last_page })
}

const capSizesCreateBodySchema = z.object({
  name: z.string().min(1),
  hex_code: z.string().min(7).max(7),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const fashionModuleService: HairPropsModuleService =
    req.scope.resolve(HAIR_PROPS_MODULE)

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const validatedData = capSizesCreateBodySchema.parse(body)

  const capSize = await fashionModuleService.createCapSizes({
    ...validatedData,
    product_length_id: req.params.id,
  })

  res.status(200).json(capSize)
}
