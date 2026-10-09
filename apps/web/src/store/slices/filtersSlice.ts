import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ExpenseFilters } from '../../types'

const initialState: ExpenseFilters = {
  search: '',
  categoryId: '',
  paymentMethod: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
  sortBy: 'date',
  order: 'desc',
  page: 1,
  limit: 10,
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload
      state.page = 1
    },
    setCategoryId(state, action: PayloadAction<string>) {
      state.categoryId = action.payload
      state.page = 1
    },
    setPaymentMethod(state, action: PayloadAction<string>) {
      state.paymentMethod = action.payload
      state.page = 1
    },
    setDateFrom(state, action: PayloadAction<string>) {
      state.dateFrom = action.payload
      state.page = 1
    },
    setDateTo(state, action: PayloadAction<string>) {
      state.dateTo = action.payload
      state.page = 1
    },
    setAmountMin(state, action: PayloadAction<string>) {
      state.amountMin = action.payload
      state.page = 1
    },
    setAmountMax(state, action: PayloadAction<string>) {
      state.amountMax = action.payload
      state.page = 1
    },
    setSortBy(state, action: PayloadAction<ExpenseFilters['sortBy']>) {
      state.sortBy = action.payload
      state.page = 1
    },
    setOrder(state, action: PayloadAction<'asc' | 'desc'>) {
      state.order = action.payload
      state.page = 1
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    resetFilters() {
      return initialState
    },
  },
})

export const {
  setSearch, setCategoryId, setPaymentMethod,
  setDateFrom, setDateTo, setAmountMin, setAmountMax,
  setSortBy, setOrder, setPage, resetFilters,
} = filtersSlice.actions

export default filtersSlice.reducer
