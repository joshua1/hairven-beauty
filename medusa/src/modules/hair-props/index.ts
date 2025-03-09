import { Module } from '@medusajs/framework/utils'
import HairPropsModuleService from './service'

export const HAIR_PROPS_MODULE = 'hairPropsModuleService'

export default Module(HAIR_PROPS_MODULE, {
  service: HairPropsModuleService,
})
