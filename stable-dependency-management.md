# Ensuring Stability: Freezing Dependencies and Building Custom Docker Images

In software development, especially when working with rapidly evolving open-source projects like Hyperledger Iroha, relying on the absolute latest version (e.g., `latest` or frequently updated `rc` tags) can introduce instability. This document outlines a crucial strategy to "freeze" a known stable version of an upstream dependency by forking its repository, building a custom Docker image, and integrating it into your `docker-compose.yml` file.

## 1. The Problem: Unpredictable Dependencies

Imagine navigating a ship using a map that constantly redraws itself with subtle, undocumented changes. This is analogous to using a `docker-compose.yml` that pulls `:latest` or frequently updated development images:

* **Sudden Breakages:** A new push to the upstream repository might contain bugs or breaking changes that immediately affect your running environment.
* **Debugging Nightmare:** When something breaks, it's difficult to determine if the issue is in your code, your configuration, or a change in the upstream dependency.
* **Inconsistent Environments:** Your local setup might differ from a colleague's or a deployment environment if they pulled the image at a different time.
* **Deadline Pressure:** Unexpected changes can severely impact project timelines and lead to significant frustration.

## 2. The Solution: "Pinning and Forking" for a Stable Baseline

To counteract this unpredictability, we adopt a strategy to create a stable, reproducible reference point for our core dependencies. This involves:

* **Version Pinning:** Explicitly defining the exact version of the dependency we want to use.
* **Repository Forking:** Creating a personal copy of the upstream repository.
* **Custom Image Building:** Building our own Docker images from a specific, verified commit of the forked repository.

### Benefits of this Method:

* **Reproducibility:** You can always recreate the exact same working environment, ensuring consistency across development, testing, and deployment.
* **Stability:** Your application becomes immune to unannounced or untested changes in the upstream repository's `main` or development branches.
* **Control over Updates:** You decide *when* to integrate new versions of the dependency after thoroughly testing them in your own environment.
* **Reduced Debugging Time:** When an issue arises, you can confidently rule out unexpected dependency changes as the cause, focusing your efforts on your own code or configuration.
* **"Terrestrial Landmarks":** Like a captain plotting a course with fixed landmarks, you gain clear, verifiable reference points for your system's foundation.

### Risks of NOT Using this Method (The "Unsafe Navigation"):

* **Unpredictable Breakages:** As mentioned, your application can suddenly stop working due to a new, untested commit upstream.
* **Difficulty in Debugging:** The "did I break it, or did they?" problem becomes rampant, wasting valuable development time.
* **"Works on My Machine" Syndrome:** Different developers, or even the same developer on different days, might pull different versions of the `latest` image, leading to inconsistencies.
* **Project Delays:** Constant firefighting of dependency-induced issues can cause significant project delays and missed deadlines.
* **Lower Precision and Trust:** The continuous shifts in the foundation undermine confidence in the stability and correctness of your own work.

## 4. Case Study: Falling into the "Rabbit Hole of Insecurities"

Our recent experience with the Hyperledger Iroha 2.0 network serves as a powerful cautionary tale regarding the risks of unpinned dependencies.

**The Situation:**
On **May 30, 2025**, our Iroha 2.0 network was observed to be functioning correctly. The blockchain explorer displayed consistent block numbers, including both odd and even heights, indicating a healthy and synchronized multi-node setup. This was clearly documented with a timestamped screenshot, demonstrating a fully functional block-building process.

**The Problem Emerges:**
In the days following this successful observation, the network unexpectedly began exhibiting severe synchronization problems. We encountered:
* `Temporary failure in name resolution` errors, preventing peer communication.
* Inconsistent block heights across nodes, leading to `PrevBlockHeightMismatch`.
* Blocks "disappearing" or not being propagated consistently.

**The Trap:**
Despite our system's own configurations and troubleshooting, we initially struggled to pinpoint the root cause. Unbeknownst to us, during this period, the main developer of the Iroha 2.0 project was making small, continuous tweaks and additions to the `main` branch of the upstream repository. Each time we pulled the `hyperledger/iroha:2.0.0-rc.2.0` Docker image (which, without a specific SHA digest, can implicitly get updated with the latest `main` branch changes), we inadvertently incorporated these undocumented, potentially unstable modifications.

**The Outcome:**
Our once-stable test environment quickly spiraled into a "rabbit hole of insecurities." What should have been a straightforward process of testing our application on a stable blockchain became an arduous and time-consuming debugging effort, trying to differentiate between our own system's flaws and the unpredictable behavior introduced by external, unpinned dependencies. This significantly delayed our progress towards integrating real-world assets, highlighting how quickly a healthy test setup can be compromised by a lack of dependency control.

This experience underscores the critical importance of actively freezing and managing your dependencies to safeguard your development progress and ensure predictable system behavior.

## 5. Step-by-Step Guide to Freezing a Stable Version

To avoid such pitfalls, here’s how to proactively freeze your dependencies:

### Step 5.1: Find a "Stable" Commit Hash

The first step is to identify the precise state of the upstream repository that corresponds to your known stable point.

1.  **Navigate to the Upstream Repository's Commit History:**
    Open your web browser and go to the Hyperledger Iroha repository's commit history: [https://github.com/hyperledger-iroha/iroha/commits/main/](https://github.com/hyperledger-iroha/iroha/commits/main/) (or the relevant branch like `dev`).
2.  **Locate the Desired Commit:**
    Scroll through the commit messages and their dates. Identify a commit hash (the long alphanumeric string next to each commit) that was made on or just before your target date (e.g., May 30, 2025).
    * **Example:** For illustrative purposes, let's assume you found a commit hash like `7c4b6e8a9d1f2c3b4a5d6e7f8c9b0a1d2e3f4a5b` that fits your criteria. **You must replace this with the actual hash you find.**

### Step 5.2: Fork the Upstream Repository

To gain control over the source code, you'll create your own copy (a "fork") on GitHub.

1.  **Go to the Upstream Repository:**
    Visit [https://github.com/hyperledger-iroha/iroha](https://github.com/hyperledger-iroha/iroha).
2.  **Click "Fork":**
    In the top-right corner of the GitHub page, click the "Fork" button.
3.  **Choose Your Account:**
    Select your GitHub user account as the owner for the new fork. This will create a copy of the `hyperledger-iroha/iroha` repository under your own namespace (e.g., `your-github-username/iroha`).

### Step 5.3: Clone Your Forked Repository and Checkout the Specific Commit

Now, you'll bring your personal copy of the Iroha source code down to your local development environment (e.g., your Debian 12 VirtualBox).

1.  **Open your terminal** in your Debian 12 environment.
2.  **Clone your fork:**
    ```bash
    git clone [https://github.com/your-github-username/iroha.git](https://github.com/your-github-username/iroha.git)
    cd iroha
    ```
    (Replace `your-github-username` with your actual GitHub username.)
3.  **Checkout the specific commit:**
    This command will move your local repository's state to exactly match the commit hash you identified as stable.
    ```bash
    git checkout 7c4b6e8a9d1f2c3b4a5d6e7f8c9b0a1d2e3f4a5b
    ```
    (Again, replace with your actual commit hash.)
    * **Note:** This will put you in a "detached HEAD" state, which is fine for building an image. If you plan to make changes to your fork, you'd create a new branch from this commit (`git checkout -b stable-may30-version`).

### Step 5.4: Build Your Custom Docker Image

With the source code at your desired stable point, you can now build your own Docker image.

1.  **Ensure you are in the root directory of your cloned `iroha` repository.** This is where the main `Dockerfile` for the `irohad` service resides.
2.  **Build the image:**
    Give your image a clear, descriptive name and tag so you know exactly what it is.
    ```bash
    docker build -t your-github-username/iroha-stable:2.0.0-may30 .
    ```
    * `-t`: Tags the image with the specified name and tag.
    * `your-github-username/iroha-stable:2.0.0-may30`: Choose a tag that makes sense for you (e.g., `digitclopedia2024/iroha-stable:2.0.0-may30`).
    * `.`: Instructs Docker to build the image using the `Dockerfile` in the current directory.

### Step 5.5: Update Your `docker-compose.yml`

Finally, modify your Docker Compose configuration to use your newly built, stable image instead of the public `hyperledger/iroha` one.

1.  **Open your `docker-compose.yml` file.**
2.  **Locate the `irohad` services:** Find `irohad0`, `irohad1`, `irohad2`, and `irohad3`.
3.  **Change the `image` lines:**
    Replace the existing `image:` line for each `irohad` service.

    **Before (Example):**
    ```yaml
    services:
      irohad0:
        image: hyperledger/iroha:2.0.0-rc.2.0
        # ... other configurations
      irohad1:
        image: hyperledger/iroha:2.0.0-rc.2.0
        # ...
    ```

    **After (Example):**
    ```yaml
    services:
      irohad0:
        image: your-github-username/iroha-stable:2.0.0-may30
        # ... other configurations
      irohad1:
        image: your-github-username/iroha-stable:2.0.0-may30
        # ...
    ```
    (Replace `your-github-username/iroha-stable:2.0.0-may30` with the tag you used in Step 5.4.)

Now, when you run `sudo docker compose up -d --build`, Docker Compose will use your custom-built image, ensuring that your Iroha network's core components are based on a known, stable version. This gives you the control and predictability needed to focus on your application development.
