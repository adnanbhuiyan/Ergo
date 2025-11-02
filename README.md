# Ergo

<div align="center">
  

<!-- About the Project -->
## About the Project

Ergo is a project management application designed to enhance productivity for teams

<!-- Getting Started -->
## Getting Started (Cloning the Project)
Open a bash terminal and run the following Bash command to clone the project
```bash
 git clone <web_url>
```

<!-- Getting Started (Running the FastAPI Backend) -->
## Getting Started (Running the FastAPI Backend)

<!-- Prerequisites -->
### Prerequisites

This project requires Python version 3.13 or above. You can check your version by running the following: 

```bash
 py -V
```

### Installing Packages

Change your directory to be the server directory. To do this, from the project root run the following command:

```bash
 cd server
```

Create the Python virtual environment

```bash
 py -m venv venv
```

Activate the Python virtual environment

```bash
 source venv/scripts/activate
```

Install the required Python packages using pip and the requirements.txt file

```bash
 pip install -r requirements.txt
```

### Setting up the ENV file

Create a .env file in the server directory

In this file create two variables: SUPABASE_URL and SUPABASE_KEY

To get the values of these variables do the following:

Go to the project settings and go to the Data API tab

Copy and Paste the URL under the Project URL section into the SUPABASE_URL variable

Go to the API Keys page

Go to the API Keys section (not the Legacy API Keys section)

Copy the secret key or create a new secret key and paste it into the SUPABASE_KEY variable

### Running the FastAPI Backend Locally
From a bash terminal run the following (ensure you are in the server directory first and the Python venv is activated):

```bash
  fastapi dev src/main.py
```
   
The project will run in the following URL: http://localhost:8000/ 

### 











