import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery.js';

/**
 * Root RTK Query API. Feature folders add their endpoints with `apiSlice.injectEndpoints`.
 * Tags decide what gets refetched after a mutation.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Project', 'MyProjects', 'Skill'],
  endpoints: () => ({}),
});

/** List endpoints return { items, meta } so pages get pagination info with the data. */
export const withMeta = (data, meta) => ({ items: data, meta });
