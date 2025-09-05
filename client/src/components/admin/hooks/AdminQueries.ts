import { useQuery } from '@tanstack/react-query';

export const useAdminQueries = (activeTab: string, selectedCollectionFilter: string) => {
  // Fetch data based on active tab
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === 'students'
  });

  // Fetch teams data for team management
  const { data: teamsManagement = [], isLoading: teamsManagementLoading } = useQuery({
    queryKey: ['/api/teams'],
    enabled: activeTab === 'team-management'
  });

  // Fetch students data for team management
  const { data: studentsForTeams = [], isLoading: studentsForTeamsLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === 'team-management'
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
    enabled: activeTab === 'topics' || activeTab === 'content-hierarchy'
  });

  // Fetch all topics specifically for Challenge Subject collection
  const { data: allTopicsForChallenge = [], isLoading: allTopicsLoading } = useQuery({
    queryKey: ['/api/topics/all'],
    queryFn: async () => {
      const response = await fetch('/api/topics', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch all topics');
      return response.json();
    },
    enabled: activeTab === 'content-hierarchy' && selectedCollectionFilter === '0xXjizwoLNb98GGWQwQAT'
  });

  const { data: content = [], isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content'],
    enabled: activeTab === 'content' || activeTab === 'content-hierarchy'
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
    enabled: activeTab === 'questions'
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/assignments'],
    enabled: activeTab === 'assignments'
  });

  const { data: matching = [], isLoading: matchingLoading } = useQuery({
    queryKey: ['/api/matching'],
    enabled: activeTab === 'matching'
  });

  const { data: writingSubmissions = [], isLoading: writingSubmissionsLoading, error: writingSubmissionsError } = useQuery({
    queryKey: ['/api/writing-submissions/all'],
    queryFn: async () => {
      console.log('Fetching writing submissions...');
      const response = await fetch('/api/writing-submissions/all', {
        credentials: 'include'
      });
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch writing submissions: ${response.status}`);
      }

      const text = await response.text();
      console.log('Raw response text (first 200 chars):', text.substring(0, 200));

      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON data:', data?.length ? `${data.length} items` : data);
        return data;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error('Failed to parse JSON response');
      }
    },
    enabled: activeTab === 'writing-submissions'
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === 'writing-submissions'
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ['/api/collections'],
    enabled: activeTab === 'collections' || activeTab === 'content-hierarchy'
  });

  const { data: roundsYears } = useQuery({
    queryKey: ['/api/teams/rounds-years'],
    queryFn: async () => {
      const response = await fetch('/api/teams/rounds-years', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch rounds and years');
      return response.json();
    },
    enabled: activeTab === 'team'
  });

  // Fetch collection content when needed
  const { data: selectedCollectionContent = [] } = useQuery({
    queryKey: ['/api/collections', selectedCollectionFilter, 'content'],
    queryFn: async () => {
      if (selectedCollectionFilter === 'all') return [];
      const response = await fetch(`/api/collections/${selectedCollectionFilter}/content`);
      if (!response.ok) throw new Error('Failed to fetch collection content');
      return response.json();
    },
    enabled: selectedCollectionFilter !== 'all' && activeTab === 'content-hierarchy'
  });

  return {
    students,
    studentsLoading,
    teamsManagement,
    teamsManagementLoading,
    studentsForTeams,
    studentsForTeamsLoading,
    topics,
    topicsLoading,
    allTopicsForChallenge,
    allTopicsLoading,
    content,
    contentLoading,
    questions,
    questionsLoading,
    assignments,
    assignmentsLoading,
    matching,
    matchingLoading,
    writingSubmissions,
    writingSubmissionsLoading,
    writingSubmissionsError,
    allUsers,
    collections,
    collectionsLoading,
    roundsYears,
    selectedCollectionContent
  };
};
