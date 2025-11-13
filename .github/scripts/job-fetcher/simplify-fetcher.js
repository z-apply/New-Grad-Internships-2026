const axios = require('axios');

/**
 * Fetch internships from SimplifyJobs Summer2026-Internships
 * @param {number} maxAgeHours - Maximum age of jobs to include (default: 48 hours)
 * @returns {Promise<Array>} Array of internship objects in standard format
 */
async function fetchSimplifyInternships(maxAgeHours = 48) {
  const dataSourceUrl = 'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json';

  try {
    console.log('📡 Fetching internships from SimplifyJobs Summer2026...');

    const response = await axios.get(dataSourceUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Zapply-Internships/1.0'
      },
      timeout: 60000
    });

    if (!Array.isArray(response.data)) {
      console.error('❌ Invalid data format from SimplifyJobs');
      return [];
    }

    // Calculate age cutoff
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const cutoffTimestamp = (now - maxAgeMs) / 1000; // Convert to Unix seconds

    // Filter and transform jobs
    const jobs = response.data
      .filter(job => {
        // Must be active and have URL
        if (!job.active || !job.url) return false;

        // Age filter
        if (maxAgeHours && job.date_posted) {
          return job.date_posted >= cutoffTimestamp;
        }

        return true;
      })
      .map(job => ({
        // Standard format matching New-Grad-Jobs
        job_title: job.title,
        title: job.title,
        employer_name: job.company_name,
        company_name: job.company_name,
        job_city: job.locations?.[0]?.split(', ')?.[0] || 'Multiple',
        job_state: job.locations?.[0]?.split(', ')?.[1] || 'Locations',
        job_country: 'US',
        job_description: `Join ${job.company_name} for this Summer 2026 internship opportunity.`,
        job_apply_link: job.url,
        url: job.url,
        job_posted_at_datetime_utc: job.date_posted ? new Date(job.date_posted * 1000).toISOString() : new Date().toISOString(),
        job_employment_type: 'INTERN',
        // Additional metadata
        terms: job.terms || [],
        locations: job.locations || [],
        category: job.category || 'Software Engineering',
        is_visible: job.is_visible !== false
      }));

    console.log(`✅ SimplifyJobs: ${jobs.length} active internships`);

    // Log age filter stats if applied
    if (maxAgeHours) {
      const totalJobs = response.data.filter(j => j.active && j.url).length;
      const filtered = totalJobs - jobs.length;
      if (filtered > 0) {
        console.log(`⏰ Filtered ${filtered} jobs older than ${maxAgeHours}h`);
      }
    }

    return jobs;

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error(`⏱️  SimplifyJobs: Request timeout (>60s)`);
    } else if (error.response) {
      console.error(`❌ SimplifyJobs: HTTP ${error.response.status}`);
    } else {
      console.error(`❌ SimplifyJobs: ${error.message}`);
    }
    return [];
  }
}

module.exports = {
  fetchSimplifyInternships
};
