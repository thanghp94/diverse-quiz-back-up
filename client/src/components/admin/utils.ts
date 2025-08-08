import { User } from './types';

export const getStudentCounts = (students: User[] | undefined) => {
  if (!students) return { total: 0, active: 0, inactive: 0 };
  
  const active = students.filter(student => {
    const showValue = student.show;
    return showValue !== 'false' && showValue !== false;
  }).length;
  const inactive = students.length - active;
  
  return {
    total: students.length,
    active,
    inactive
  };
};

export const getFilteredStudents = (
  students: User[] | undefined,
  filter: 'all' | 'active' | 'inactive',
  searchTerm: string
) => {
  if (!students) return [];
  
  let filtered = students;
  
  // Apply status filter
  if (filter === 'active') {
    filtered = students.filter(student => {
      const showValue = student.show;
      return showValue !== 'false' && showValue !== false;
    });
  } else if (filter === 'inactive') {
    filtered = students.filter(student => {
      const showValue = student.show;
      return showValue === 'false' || showValue === false;
    });
  }
  
  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(student =>
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.meraki_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  return filtered;
};


export const formatMedalResults = (medalResults: any) => {
  if (!medalResults || !Array.isArray(medalResults)) return [];
  
  // Group by year and division
  const grouped = medalResults.reduce((acc: any, result: any) => {
    const key = `${result.year}-${result.division}`;
    if (!acc[key]) {
      acc[key] = {
        year: result.year,
        division: result.division,
        results: []
      };
    }
    acc[key].results.push(result);
    return acc;
  }, {});
  
  return Object.values(grouped);
};

export const formatCategoryName = (key: string) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
};