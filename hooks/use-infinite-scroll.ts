import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

type QueryFn = (params: { pageParam: number }) => Promise<any>

export const useInfiniteScroll = (queryFn: QueryFn) => {
    const { ref, inView } = useInView()

    const query = useInfiniteQuery({
        queryKey: ['messages'],
        queryFn,
        getNextPageParam: (_, pages) => pages.length * 50,
        initialPageParam: 0,
    })

    useEffect(() => {
        if (inView) {
            query.fetchNextPage()
        }
    }, [inView, query])

    return { ...query, ref }
} 