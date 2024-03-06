<script setup lang="ts">
import { formatPrice, roundDecimals } from '~/utils'

type TaxBracket = {
	min: number
	max: number | null
	marginalTaxRate: number
	deductionFormula: string | null
	effectiveMonthlyRate: number | null
}

type Preset = {
	defaultHourlyRate: number
	label: string
	taxes: {
		freelance: number
		employee: number
	}
	currency: string
	totalPaymentMonthsForEmployee: number
	totalPaymentsMonthsForFreelancer: number
	workingDays: number
	workingHours: number
	monthsInYear: number
	taxTable?: TaxBracket[]
}

type NetAndGross = {
	gross: number
	net: number
}

type Summary = {
	hourly: NetAndGross
	daily: NetAndGross
	monthly: NetAndGross
	yearly: NetAndGross
	taxes?: {
		yearly: number
		monthly: number
	}
	[key: string]: any
}

type TimeFrameType = 'Per Year' | 'Per Month' | 'Per Hour'

// Por tua Conta
// 21.4 Recibos Verdes - 25.2 % - Empresario Nome Individual Segurança Social
// 25% IRS

// Por conta de outrem
// 11% Segurança Social
// 22.2% IRS - etc

// Presets for different Countries
const presets: Preset[] = [
	{
		defaultHourlyRate: 8.5,
		label: 'Portugal',
		taxes: {
			freelance: 46.4,
			employee: 34,
		},
		currency: '€',
		totalPaymentMonthsForEmployee: 14,
		totalPaymentsMonthsForFreelancer: 11,
		workingDays: 22,
		workingHours: 8,
		monthsInYear: 12,
		// taxTable: [
		// 	{ min: 0, max: 820, marginalTaxRate: 0, deductionFormula: '€0.00', effectiveMonthlyRate: 0 },
		// 	{ min: 820.01, max: 935, marginalTaxRate: 13.25, deductionFormula: '13.25% * 2.6 * (1.135,39 - R)', effectiveMonthlyRate: 5.9 },
		// 	{ min: 935.01, max: 1001, marginalTaxRate: 18, deductionFormula: '18% * 1.4 * (1.385,20 - R)', effectiveMonthlyRate: 8.3 },
		// 	{ min: 1001.01, max: 1123, marginalTaxRate: 18, deductionFormula: '€96.82', effectiveMonthlyRate: 9.4 },
		// 	{ min: 1123.01, max: 1765, marginalTaxRate: 26, deductionFormula: '€186.66', effectiveMonthlyRate: 15.4 },
		// 	{ min: 1765.01, max: 2057, marginalTaxRate: 32.75, deductionFormula: '€305.80', effectiveMonthlyRate: 17.9 },
		// 	{ min: 2057.01, max: 2664, marginalTaxRate: 37, deductionFormula: '€393.23', effectiveMonthlyRate: 22.2 },
		// 	{ min: 2664.01, max: 3193, marginalTaxRate: 38.72, deductionFormula: '€439.05', effectiveMonthlyRate: 25 },
		// 	{ min: 3193.01, max: 4173, marginalTaxRate: 40.05, deductionFormula: '€481.52', effectiveMonthlyRate: 28.5 },
		// 	{ min: 4173.01, max: 5470, marginalTaxRate: 41, deductionFormula: '€521.17', effectiveMonthlyRate: 31.5 },
		// 	{ min: 5470.01, max: 6540, marginalTaxRate: 42.7, deductionFormula: '€614.16', effectiveMonthlyRate: 33.3 },
		// 	{ min: 6540.01, max: 20067, marginalTaxRate: 44.95, deductionFormula: '€761.31', effectiveMonthlyRate: 41.2 },
		// 	{ min: 20067.01, max: null, marginalTaxRate: 47.17, deductionFormula: '€1.206,80', effectiveMonthlyRate: null },
		// ]
	},
]

const timeFrameTypes: TimeFrameType[] = ['Per Year', 'Per Month', 'Per Hour']
const timeframe = ref<TimeFrameType>(timeFrameTypes[0])

const currentPreset = reactive<Preset>({ ...presets[0] })
const isShowingAdvanced = ref(false)
const decimals = ref(2)
const hourlyRate = ref(currentPreset.defaultHourlyRate)
const inputValue = ref(35000)

// When the type or value changes
const onValueChanged = () => {
	const value = Number(inputValue.value)
	if (timeframe.value === 'Per Year') {
		hourlyRate.value = value / currentPreset.monthsInYear / currentPreset.workingDays / currentPreset.workingHours
	} else if (timeframe.value === 'Per Month') {
		hourlyRate.value = value / currentPreset.workingDays / currentPreset.workingHours
	} else {
		hourlyRate.value = value
	}
}

const onTimeFrameChanged = (newTimeFrame: TimeFrameType) => {
	// Convert current inputValue to a yearly rate first for simplicity
	let yearlyRate: number
	switch (timeframe.value) {
		case 'Per Year': {
			yearlyRate = Number(inputValue.value)
			break
		}
		case 'Per Month': {
			yearlyRate = Number(inputValue.value) * currentPreset.monthsInYear
			break
		}
		case 'Per Hour': {
			yearlyRate = Number(inputValue.value) * currentPreset.workingHours * currentPreset.workingDays * currentPreset.monthsInYear
			break
		}
	}

	let newValue: number | string = 0
	switch (newTimeFrame) {
		case 'Per Year': {
			newValue = yearlyRate.toString()
			break
		}
		case 'Per Month': {
			newValue = (yearlyRate / currentPreset.monthsInYear).toString()
			break
		}
		case 'Per Hour': {
			newValue = (yearlyRate / (currentPreset.workingHours * currentPreset.workingDays * currentPreset.monthsInYear)).toString()
			break
		}
	}

	// Update the timeframe and recalculate the hourly rate based on the new input value
	inputValue.value = roundDecimals(newValue, 0)
	timeframe.value = newTimeFrame
}

// Watch if the user changed the value and convert it
watch(() => inputValue.value, onValueChanged)

const valueWithoutTaxes = (value: number, rate: number) => value * ((100 - rate) / 100)

const calculateNetAndTaxes = (gross: number, taxRate: number) => {
	return {
		gross,
		net: valueWithoutTaxes(gross, taxRate),
	}
}

const generatePresetFromBase = (base: Summary, months: number, taxRate: number): Summary => {
	const yearly = base.monthly.gross * months
	return {
		hourly: calculateNetAndTaxes(base.hourly.gross, taxRate),
		daily: calculateNetAndTaxes(base.daily.gross, taxRate),
		monthly: calculateNetAndTaxes(base.monthly.gross, taxRate),
		yearly: calculateNetAndTaxes(yearly, taxRate),
		taxes: {
			yearly: base.yearly.gross - (base.yearly.gross * (1 - taxRate)),
			monthly: base.monthly.gross - (base.monthly.gross * (1 - taxRate)),
		}
	}
}

const generateTableFromSummary = (summaryData: Summary, label: string) => {
	return [
		{
			type: 'Hourly',
			value: tooltipValue(summaryData.hourly.gross, summaryData.hourly.net),
		},
		{
			type: 'Daily',
			value: tooltipValue(summaryData.daily.gross, summaryData.daily.net),
		},
		{
			type: 'Monthly',
			value: tooltipValue(summaryData.monthly.gross, summaryData.monthly.net),
		},
		{
			type: 'Yearly',
			value: tooltipValue(summaryData.yearly.gross, summaryData.yearly.net),
		}
	]
}

const tooltipValue = (label: number, value: number) => {
	return {
		text: formatPrice(value, decimals.value, currentPreset.currency),
		tooltip: formatPrice(label, decimals.value, currentPreset.currency),
		description: '',
	}
}

const generateCompareAgainstEmployee = (base: Summary): Summary => {
	const perYear = base.monthly.gross * currentPreset.totalPaymentsMonthsForFreelancer
	const perMonth = perYear / currentPreset.totalPaymentMonthsForEmployee
	const perDay = perMonth / currentPreset.workingDays
	const perHour = perDay / currentPreset.workingHours

	return {
		hourly: calculateNetAndTaxes(perHour, currentPreset.taxes.freelance),
		daily: calculateNetAndTaxes(perDay, currentPreset.taxes.freelance),
		monthly: calculateNetAndTaxes(perMonth, currentPreset.taxes.freelance),
		yearly: calculateNetAndTaxes(perYear, currentPreset.taxes.freelance),
	}
}

const summary = computed<{ [key: string]: Summary }>(() => {
	const perDay = hourlyRate.value * currentPreset.workingHours
	const perHour = hourlyRate.value
	const perMonth = hourlyRate.value * currentPreset.workingDays * currentPreset.workingHours
	const perYear = perMonth * currentPreset.monthsInYear

	const base: Summary = {
		hourly: {
			gross: perHour,
			net: perHour,
		},
		daily: {
			gross: perDay,
			net: perDay,
		},
		monthly: {
			gross: perMonth,
			net: perMonth,
		},
		yearly: {
			gross: perYear,
			net: perYear,
		}
	}

	return {
		base,
		freelance: generatePresetFromBase(base, currentPreset.totalPaymentsMonthsForFreelancer, currentPreset.taxes.freelance),
		employee: generatePresetFromBase(base, currentPreset.totalPaymentMonthsForEmployee, currentPreset.taxes.employee),
		compare: generateCompareAgainstEmployee(base),
	}
})

const sections = computed(() => {
	const baseTable = generateTableFromSummary(summary.value.base, 'Base')
	const freelanceTable = generateTableFromSummary(summary.value.freelance, 'Freelancer')
	const freelanceCompareTable = generateTableFromSummary(summary.value.compare, 'Compare')
	const employeeTable = generateTableFromSummary(summary.value.employee, 'Employee')

	return [
		{
			key: 'summary',
			label: 'Summary',
			sections: [
				{
					description: 'Gross Income',
					key: 'gross-income',
					table: baseTable,
				}
			]
		},
		{
			key: 'freelancer',
			label: 'Freelancer',
			sections: [
				{
					key: 'freelancer-income',
					description: `Prices after taxes ${currentPreset.taxes.freelance}% for ${currentPreset.totalPaymentsMonthsForFreelancer} months`,
					table: freelanceTable,
				},
				{
					key: 'freelancer-compare-income',
					description: `Prices after taxes ${currentPreset.taxes.freelance}% for ${currentPreset.totalPaymentMonthsForEmployee} months`,
					table: freelanceCompareTable
				}
			]
		},
		{
			key: 'employee',
			label: 'Employee',
			description: `Prices after taxes ${currentPreset.taxes.employee}%`,
			sections: [
				{
					key: 'employee-income',
					description: `Prices after taxes ${currentPreset.taxes.employee}% for ${currentPreset.totalPaymentMonthsForEmployee} months`,
					table: employeeTable,
				}
			]
		},
	]
})

</script>
<template>
	<div class="max-w-md mx-auto my-10">
		<u-card>
			<template #header>
				<h2 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
					Salary Calculator
				</h2>
			</template>
			<template #default>
				<div class="grid grid-cols-1 gap-y-4">
					<!-- Form -->
					<u-form-group
						:label="`Income`"
						required
					>
						<template #help>
							Your current GROSS income, hourly, monthly or yearly
						</template>
						<template #default>
							<div class="grid grid-cols-1 gap-y-2">
								<u-input
									v-model="inputValue"
									:placeholder="'30000'"
									type="number"
									icon="i-heroicons-currency-dollar"
								/>
								<u-select
									:model-value="timeframe"
									:options="timeFrameTypes"
									@update:model-value="onTimeFrameChanged"
								/>
							</div>
						</template>
					</u-form-group>
					<u-divider>
						<template #default>
							<p
								class="text-xs cursor-pointer text-gray-500 dark:text-gray-400 select-none"
								@click="isShowingAdvanced = !isShowingAdvanced"
							>
								{{ isShowingAdvanced ? 'Hide Options' : 'Show Options' }}
							</p>
						</template>
					</u-divider>
					<!-- Advanced / Preset -->
					<div
						v-show="isShowingAdvanced"
						class="grid grid-cols-1 gap-y-2"
					>
						<u-form-group
							:label="`Tax Rate (%) Freelance/Employee`"
							help="The tax rate in % that you need to pay"
							required
						>
							<template #default>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-1 gap-y-2">
									<u-input
										v-model="currentPreset.taxes.freelance"
										placeholder="The tax rate in % that you need to pay as freelancer"
									/>
									<u-input
										v-model="currentPreset.taxes.employee"
										placeholder="The tax rate in % that you need to pay as freelancer"
									/>
								</div>
							</template>
						</u-form-group>
						<u-form-group
							:label="`Nº Payments Freelancing/Employee`"
							help="The amount of payments you received as an employee in the country. Ex in portugal is 14"
							required
						>
							<template #default>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-1 gap-y-2">
									<u-input
										v-model="currentPreset.totalPaymentsMonthsForFreelancer"
										type="number"
										min="1"
										max="20"
										placeholder="14"
									/>
									<u-input
										v-model="currentPreset.totalPaymentMonthsForEmployee"
										type="number"
										min="1"
										max="20"
										placeholder="14"
									/>
								</div>
							</template>
						</u-form-group>
						<u-form-group
							:label="`Working Days / Hours`"
							help="Amount of working days per month, usually in Portugal is 22"
							required
						>
							<template #default>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-1 gap-y-2">
									<u-input
										v-model="currentPreset.workingDays"
										type="number"
										min="1"
										max="31"
										placeholder="22"
									/>
									<u-input
										v-model="currentPreset.workingHours"
										type="number"
										min="1"
										max="24"
										placeholder="8"
									/>
								</div>
							</template>
						</u-form-group>
					</div>
				</div>
			</template>
			<template #footer>
				<u-tabs
					:items="sections"
					class="w-full"
				>
					<template #item="{ item }">
						<template
							v-for="childSection in item.sections"
							:key="childSection.key"
						>
							<p
								v-if="childSection.description"
								class="text-center text-xs -mt-2- text-gray-500"
							>
								{{ childSection.description }}
							</p>
							<u-table
								v-if="childSection.table"
								:rows="childSection.table"
								:ui="{
									divide: 'divide-none',
									thead: 'hidden',
									td: {
										padding: 'py-1 px-2'
									}
								}"
							>
								<template #value-data="{ row }">
									<div class="text-right w-full">
										<u-tooltip :popper="{ arrow: true }">
											<template #default>
												{{ row.value.text }}
											</template>
											<template #text>
												<span
													v-if="row.value.tooltip"
													class="text-gray-500 dark:text-gray-400 cursor-pointer"
												>{{ row.value.tooltip }}</span>
											</template>
										</u-tooltip>
									</div>
								</template>
							</u-table>
						</template>
					</template>
				</u-tabs>
			</template>
		</u-card>
	</div>
</template>
