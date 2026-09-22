import { apiSlice, withMeta } from '../../api/apiSlice.js';
import { cleanParams } from '../../lib/formErrors.js';

const invalidateProject = (_result, _error, arg) => {
  const id = typeof arg === 'string' ? arg : arg?.id;
  return [
    ...(id ? [{ type: 'Project', id }] : []),
    { type: 'Project', id: 'LIST' },
    'MyProjects',
  ];
};

export const projectsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listProjects: builder.query({
      query: (params = {}) => ({ url: '/projects', params: cleanParams(params) }),
      transformResponse: withMeta,
      providesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    // `viewer` is not sent to the API; it only makes the cache entry per-viewer, because the
    // response says what *this* viewer may do (owner controls, apply button).
    getProject: builder.query({
      query: ({ id }) => ({ url: `/projects/${id}` }),
      providesTags: (_result, _error, { id }) => [{ type: 'Project', id }],
    }),
    myProjects: builder.query({
      query: (params = {}) => ({ url: '/projects/mine', params: cleanParams(params) }),
      transformResponse: withMeta,
      providesTags: ['MyProjects'],
    }),
    createProject: builder.mutation({
      query: (body) => ({ url: '/projects', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }, 'MyProjects'],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: invalidateProject,
    }),
    publishProject: builder.mutation({
      query: (id) => ({ url: `/projects/${id}/publish`, method: 'POST' }),
      invalidatesTags: invalidateProject,
    }),
    unpublishProject: builder.mutation({
      query: (id) => ({ url: `/projects/${id}/unpublish`, method: 'POST' }),
      invalidatesTags: invalidateProject,
    }),
    changeProjectStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/projects/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: invalidateProject,
    }),
    deleteProject: builder.mutation({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: invalidateProject,
    }),
  }),
});

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useMyProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  usePublishProjectMutation,
  useUnpublishProjectMutation,
  useChangeProjectStatusMutation,
  useDeleteProjectMutation,
} = projectsApi;
