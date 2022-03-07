<script>
  import Loading from "./Loading.svelte";
  import Filter from "./Filter.svelte";
  import ImageSelect from "./ImageSelect.svelte";
  import NoErrors from "./NoErrors.svelte";
  import Vulnerabilities from "./Vulnerabilities.svelte";

  let all;
  let critical;
  let high;
  let medium;
  let low;
  let unknown;

  let selected;
  let allVulnerabilities = [];
  let vulnerabilities = [];
  let noErrors = false;
  let disableButton = false;

  class TrivyVulnerability {
    constructor(v) {
      this.id = v.VulnerabilityID;
      this.title = v.Title;
      this.severity = v.Severity;
      this.severityClass = v.Severity.toLowerCase();
      this.description = v.Description;
      this.pkgName = v.PkgName;
      this.installedVersion = v.InstalledVersion ? v.InstalledVersion : "";
      this.fixedVersion = v.FixedVersion ? v.FixedVersion : "";
      this.references = v.References;
      this.primaryURL = v.PrimaryURL;
      this.visible = false;

      incrementCounter(v.Severity);
    }
  }

  const getSeverityOrdering = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return 0;
      case "HIGH":
        return 1;
      case "MEDIUM":
        return 2;
      case "LOW":
        return 3;
      case "UNKNOWN":
        return 4;
    }
  };

  async function checkForCacheVolume() {
    var exists = false;
    await window.ddClient.docker.cli
      .exec("volume", [
        "ls",
        "-f",
        "name=trivy-docker-extension-cache",
        "--format='{{json .}}'",
      ])
      .then((result) => {
        console.log(result);
        if (result.stdout !== "") {
          exists = true;
        }
      });
    return exists;
  }

  async function createCacheVolume() {
    var success = true;
    await window.ddClient.docker.cli
      .exec("volume", ["create", "trivy-docker-extension-cache"])
      .then((result) => {
        if (result.stderr !== "") {
          success = false;
        }
      });
    return success;
  }

  async function triggerTrivy(event) {
    selected = event.detail.image;
    resetCounters();

    var loadingOverlay = document.querySelector(".loading");
    loadingOverlay.classList.remove("hidden");

    if (!(await checkForCacheVolume())) {
      await createCacheVolume().then((created) => {
        if (!created) {
          loadingOverlay.classList.add("hidden");
          console.log("failed to create volume");
          return;
        }
      });
      window.ddClient.desktopUI.toast.warning(
        `Creating vulnerability cache volume on first run, populating this will cause a slight delay.`
      );
    }

    let stdout = "";
    let stderr = "";
    await window.ddClient.docker.cli.exec(
      "run",
      [
        "--rm",
        "-v",
        "/var/run/docker.sock:/var/run/docker.sock",
        "-v",
        "trivy-docker-extension-cache:/root/.cache",
        "aquasec/trivy",
        "--quiet",
        "image",
        "-f=json",
        selected,
      ],
      {
        stream: {
          onOutput(data) {
            stdout += data.stdout;
            if (data.stderr) {
              stderr += data.stderr;
            }
          },
          onError(error) {
            window.ddClient.desktopUI.toast.error(
              `An error occurred while scanning ${selected}`
            );
            console.error(error);
          },

          onClose(exitCode) {
            disableButton = false;
            document.querySelector(".loading").classList.add("hidden");
            if (exitCode === 0) {
              window.ddClient.desktopUI.toast.success(
                `Scan of ${selected} completed successfully`
              );
              var res = { stdout: stdout, stderr: stderr };
              processResult(res);
            } else {
              window.ddClient.desktopUI.toast.error(
                `An error occurred while scanning ${selected}`
              );
            }
          },
        },
      }
    );
  }

  function processResult(res) {
    noErrors = false;
    document.querySelector(".loading").classList.add("hidden");

    let vulns = [];
    if (res.stderr !== "") {
      return;
    }

    var results = JSON.parse(res.stdout);

    if (results.Results === undefined) {
      vulnerabilities = [];
      noErrors = true;
      return;
    }
    for (let i = 0; i < results.Results.length; i++) {
      let r = results.Results[i];
      if (r.Vulnerabilities === undefined) {
        continue;
      }
      for (let j = 0; j < r.Vulnerabilities.length; j++) {
        let v = r.Vulnerabilities[j];
        vulns.push(new TrivyVulnerability(v));
      }
    }

    vulns.sort((a, b) => {
      if (getSeverityOrdering(a.severity) === getSeverityOrdering(b.severity)) {
        return a.id >= b.id ? 1 : -1;
      }
      return getSeverityOrdering(a.severity) >= getSeverityOrdering(b.severity)
        ? 1
        : -1;
    });

    console.log(vulns);
    allVulnerabilities = vulns;
    vulnerabilities = allVulnerabilities;
    if (vulnerabilities.length === 0) {
      noErrors = true;
    }
  }

  function filterSeverity(event) {
    const severity = event.detail.severity;

    if (severity === "all") {
      vulnerabilities = allVulnerabilities;
      return;
    }
    const filtered = allVulnerabilities.filter((v) => v.severity == severity);

    vulnerabilities = filtered;
  }

  function resetCounters() {
    vulnerabilities = [];
    all = 0;
    critical = 0;
    high = 0;
    medium = 0;
    low = 0;
    unknown = 0;
  }

  function incrementCounter(severity) {
    all += 1;
    switch (severity) {
      case "CRITICAL":
        critical += 1;
        return;
      case "HIGH":
        high += 1;
        return;
      case "MEDIUM":
        medium += 1;
        return;
      case "LOW":
        low += 1;
        return;
      case "UNKNOWN":
        unknown += 1;
        return;
    }
  }
</script>

<main>
  <div class="header">
    <img src="./build/images/trivy.svg" alt="Trivy Logo" height="120px" />
    <ImageSelect bind:disableButton on:startscan={triggerTrivy} />
  </div>

  <Loading />
  <div class="container">
    {#if vulnerabilities.length > 0}
      <Filter
        {all}
        {critical}
        {high}
        {medium}
        {low}
        {unknown}
        on:filter={filterSeverity}
      />
    {/if}
  </div>
  <Vulnerabilities {vulnerabilities} />
  {#if noErrors}
    <NoErrors {selected} />
  {/if}
</main>

<style>
  .header {
    background-image: url("images/trivy.png");
    background-size: cover;
    background-position: center;
    padding: 30px;
    padding-top: 200px;
    padding-bottom: 220px;
  }

  .container {
    background-color: #e6eaec;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
