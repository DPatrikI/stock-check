Stock Tracking Application

This is a stock tracking application that allows users to fetch and track stock prices in real-time. The application consists of a backend server built with NestJS and a frontend client built with Next.js. It utilizes the Finnhub API to retrieve stock market data.

Prerequisites

	•	Docker and Docker Compose installed on your machine.

Installation and Setup

	1.	Clone the Repository
    git clone https://github.com/DPatrikI/stock-check.git
    cd <repository-directory>

	2.	Set Up Environment Variables
     •	Create a .env file in the root directory
     •	Edit the .env file and add your Finnhub API key:
         FINNHUB_API_KEY=your_finnhub_api_key_here

	3.	Build and Run the Application
        docker-compose build
        docker-compose up

Usage

	•	Access the frontend at http://localhost:3001

	•	The backend API is available at http://localhost:3000

Environment Variables

The application requires the following environment variable:

	•	FINNHUB_API_KEY: Your Finnhub API key for accessing stock market data.
