# JobFit Analyzer

JobFit Analyzer is a powerful Chrome Extension that analyzes job descriptions against your resume, providing match scores, skill gaps, and tailored cover letters. It currently supports popular job boards like LinkedIn, Indeed, Naukri, and Internshala.

## Features

*   **Resume Matching**: Instantly see how well your resume matches a job description with a dedicated ATS Match Score.
*   **Skill Gap Analysis**: Identify the specific skills you possess and the ones you are missing for the role.
*   **Tailored Cover Letters**: Generate personalized cover letters based on the job description and your unique profile.
*   **Broad Platform Support**: Works seamlessly on major job portals including LinkedIn, Indeed, Naukri, and Internshala.

## How to Install and Use

Since this extension is not yet published on the Chrome Web Store, you can easily load it locally into your browser using Developer Mode.

### Prerequisites
*   Google Chrome Browser (or a Chromium-based browser like Edge or Brave)

### Installation Steps

1.  **Clone or Download the Repository:**
    *   Clone this repository to your local machine using Git, or download it as a ZIP file and extract it to a folder.
2.  **Open Chrome Extensions Page:**
    *   Open Google Chrome.
    *   Type `chrome://extensions/` in the address bar and press **Enter**.
    *   Alternatively, click the three dots menu (⋮) > Extensions > Manage Extensions.
3.  **Enable Developer Mode:**
    *   In the top right corner of the Extensions page, toggle the switch for **Developer mode** to ON.
4.  **Load Unpacked Extension:**
    *   Click the **Load unpacked** button that appears in the top left corner.
    *   Select the main folder where you cloned or extracted the JobFit Analyzer extension (this is the folder containing the `manifest.json` file).
5.  **Pin the Extension (Optional but Recommended):**
    *   Click the puzzle piece icon in your browser toolbar.
    *   Find "JobFit Analyzer" in the list and click the pushpin icon to pin it to your toolbar for easy access.

## How to Use the Extension

1.  Navigate to any job listing on one of the supported platforms (LinkedIn, Indeed, Naukri, Internshala).
2.  Click the **JobFit Analyzer** extension icon in your browser toolbar.
3.  Upload your resume (PDF format usually works best, check the app for specifics).
4.  The extension will analyze the current job description against your resume.
5.  View your match score, analyze your skill gaps, and generate a customized cover letter to boost your application!

## Directory Structure

*   `manifest.json`: The core configuration file for the Chrome extension.
*   `popup/`: Contains the HTML, CSS, and JS for the extension's popup UI.
*   `scripts/content.js`: The script injected into job boards to interact with the page content.
*   `scripts/background.js`: The service worker that handles background tasks, API calls, and state management.
*   `styles/content.css`: Styles for any widgets or elements injected directly into the job board pages.
