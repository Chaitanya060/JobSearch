// DEVELOPMENT SEED — a fake signed-in user so the shell is navigable without
// Firebase. Replaced by verified-token data when the Worker API is wired in.

export const MOCK_PROFILE = {
  id: 'dev-user-uid',
  email: 'dev.user@example.com',
  fullName: 'Dev User',
  photoUrl: null,
  phone: null,
  educationLevel: "Bachelor's",
  degree: 'B.Tech, Computer Science',
  graduationYear: 2025,
  experienceYears: 1,
  role: 'user',
  profileCompleted: true,
}

export const MOCK_PREFERENCES = {
  preferredRoles: ['Java Developer', 'Backend Developer', 'Full-Stack Developer'],
  preferredLocations: ['Hyderabad', 'Bengaluru', 'Remote'],
  preferredCountries: ['India'],
  preferredSkills: ['Java', 'Spring Boot', 'SQL', 'React', 'Git', 'REST'],
  excludedSkills: [],
  employmentTypes: ['full-time', 'internship'],
  workModes: ['remote', 'hybrid'],
  minSalary: 500000,
  maxSalary: 1500000,
  salaryCurrency: 'INR',
  includeInternships: true,
}

export const MOCK_RESUMES = [
  {
    id: 'res-1',
    originalFilename: 'Dev_User_Resume.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 182_400,
    isPrimary: true,
    createdAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
  },
]
