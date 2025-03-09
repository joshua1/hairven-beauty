import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query'

export const useCreateProductLengthMutation = (
  options:
    | Omit<
        UseMutationOptions<
          any,
          Error,
          {
            name: string
          },
          unknown
        >,
        'mutationKey' | 'mutationFn'
      >
    | undefined = undefined
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['hair-props', 'product-length', 'create'],
    mutationFn: async (values: { name: string }) => {
      return fetch('/admin/hair-props/product-lengths', {
        method: 'POST',
        body: JSON.stringify(values),
        credentials: 'include',
      }).then((res) => res.json())
    },
    ...options,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'hair-props',
      })

      if (options?.onSuccess) {
        return options.onSuccess(...args)
      }
    },
  })
}

export const useCreateCapSizeMutation = (
  product_length_id: string,
  options:
    | Omit<
        UseMutationOptions<any, Error, { name: string }, unknown>,
        'mutationKey' | 'mutationFn'
      >
    | undefined = undefined
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['hair-props', product_length_id, 'cap-sizes', 'create'],
    mutationFn: async (values: { name: string }) => {
      return fetch(`/admin/hair-props/${product_length_id}/cap-sizes`, {
        method: 'POST',
        body: JSON.stringify(values),
        credentials: 'include',
      }).then((res) => res.json())
    },
    ...options,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'hair-props',
      })

      if (options?.onSuccess) {
        return options.onSuccess(...args)
      }
    },
  })
}
