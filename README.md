# Website (SPA) for visualizing the distribution of empirical eigenvalues of covariance matrices

Page: https://krzemon.github.io/eigenflow/

The website allows you to generate an estimator of empirical covariance matrices with different
dimensions and properties in the form of a probability density distribution
of eigenvalues, together with a theoretical curve describing this distribution and
providing statistics describing the distributions.

### Applications of Covariance Matrix Spectrum Analysis

The analysis of the spectrum of covariance matrix estimators has many practical applications in fields such as:

- machine learning  
- physics  
- biology  
- finance  

In general, it is used in areas involving **multivariate data analysis**.  
In simple terms, the obtained spectrum helps determine **which components of the matrix represent meaningful information and which correspond to noise**.

### Frontend

The frontend is implemented as a **Single Page Application (SPA)** built with:

- **HTML**
- **CSS**
- **JavaScript**

Charts and visualizations are generated using **Chart.js (`chart.umd.min.js`)**, including **histograms** and **theoretical distribution curves**.

The application retrieves data from a **backend API**, which provides the required data in **JSON format**.

Static frontend files are hosted on **GitHub Pages**, allowing the application to be publicly accessible in a web browser without requiring a dedicated server.
