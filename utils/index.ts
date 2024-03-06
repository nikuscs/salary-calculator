import type { MaybeRef } from 'vue'

/**
 * Round decimals to given size, and also truncates leading zeros
 * @param number
 * @param decimals
 */
export const roundDecimals = (number: number | string | undefined, decimals: number): number => {
	if (!number) {
		return 0
	}
	const rounded = Math.round(parseFloat(number as string) * 1000) / 1000
	return parseFloat(rounded.toFixed(decimals))
}

/**
 * Sum all the numbers in the array
 * @param args
 */
export const sum = (...args: any[]) => {
	return args.reduce((acc, val) => {
		return acc + (val || 0)
	}, 0)
}

/**
 * Format price with currency
 * @param number
 * @param decimals
 * @param currencySymbol
 */
export const formatPrice = (number: number | string, decimals = 2, currencySymbol: MaybeRef<string>) => {
	const rounded = roundDecimals(number, decimals)
	return `${rounded}${toRaw(currencySymbol)}`
}

/**
 * Converts a number into a formatted amount with dots
 *
 * @param amount
 */
export const toFormattedAmount = (amount: string | number) => {
	return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Converts a formatted amount into a number
 *
 * @param amount
 */
export const fromFormattedAmount = (amount: string | number) => {
	if (amount.toString() === '') {
		return 0
	}

	return parseFloat(amount.toString().replace(/\./g, ''))
}

export const isClient = typeof window !== 'undefined'
export const isServer = !isClient
