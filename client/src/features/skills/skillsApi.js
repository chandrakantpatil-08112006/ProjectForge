import { apiSlice, withMeta } from '../../api/apiSlice.js';
import { cleanParams } from '../../lib/formErrors.js';

export const skillsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchSkills: builder.query({
      query: (params = {}) => ({ url: '/skills', params: cleanParams(params) }),
      transformResponse: withMeta,
      providesTags: [{ type: 'Skill', id: 'LIST' }],
    }),
    createSkill: builder.mutation({
      query: (body) => ({ url: '/skills', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Skill', id: 'LIST' }],
    }),
    updateSkill: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/skills/${id}`, method: 'PATCH', data: body }),
      // Project cards embed skill names, so a rename makes cached projects stale too.
      invalidatesTags: [{ type: 'Skill', id: 'LIST' }, { type: 'Project', id: 'LIST' }],
    }),
    deleteSkill: builder.mutation({
      query: (id) => ({ url: `/skills/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Skill', id: 'LIST' }],
    }),
  }),
});

export const {
  useSearchSkillsQuery,
  useCreateSkillMutation,
  useUpdateSkillMutation,
  useDeleteSkillMutation,
} = skillsApi;
