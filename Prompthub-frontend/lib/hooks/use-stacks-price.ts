import { useState, useEffect } from "react"
import { fetchStacksPrice } from "@/lib/api"

export function useStacksPrice() {
    const [price, setPrice] = useState<number>(2.5) // Initial fallback
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function getPrice() {
            try {
                const livePrice = await fetchStacksPrice()
                setPrice(livePrice)
            } finally {
                setLoading(false)
            }
        }
        getPrice()

        // Refresh every 5 minutes
        const interval = setInterval(getPrice, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    return { price, loading }
}
