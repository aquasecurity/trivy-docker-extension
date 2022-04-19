import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';
import { ConfigureCreds } from './ConfigureCreds';

import { DefaultDisplay } from './DefaultDisplay';
import { Loading } from './Loading';
import { SBOM } from './SBOM';
import { Success } from './Success';
import { TrivyVulnerability } from './TrivyVulnerability';
import { Vulns } from './Vulns';
import { Welcome } from './Welcome';
import { SendMetric } from './Metrics';


export function App() {
  const [aquaKey, setAquaKey] = React.useState("");
  const [aquaSecret, setAquaSecret] = React.useState("");

  const [scanImage, setScanImage] = React.useState("");
  const [disableScan, setDisableScan] = React.useState(true);
  const [fixedOnly, setFixedOnly] = React.useState(true);
  const [uploadAqua, setUploadAqua] = React.useState(false);
  const [SBOMOutput, setSBOMOutput] = React.useState<boolean>(false);
  const [SBOMContent, setSBOMContent] = React.useState("");


  const [showLoginBox, setShowLoginBox] = React.useState(false);
  const [showUploadAqua, setShowUploadAqua] = React.useState("none")
  const [showSBOM, setShowSBOM] = React.useState("none");
  const [showFilter, setShowFilter] = React.useState("none");
  const [showSuccess, setShowSuccess] = React.useState("none");
  const [showDefaultDisplay, setShowDefaultDisplay] = React.useState("none");
  const [showWelcome, setShowWelcome] = React.useState("flex");

  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [all, setAll] = React.useState(0);
  const [critical, setCritical] = React.useState(0);
  const [high, setHigh] = React.useState(0);
  const [medium, setMedium] = React.useState(0);
  const [low, setLow] = React.useState(0);
  const [unknown, setUnknown] = React.useState(0);

  const [vulnerabilities, setVulnerabilities] = React.useState<TrivyVulnerability[]>([]);
  const [allVulnerabilities, setAllVulnerabilities] = React.useState<TrivyVulnerability[]>([]);

  const [loadingWait, setLoadingWait] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);



  const getSeverityOrdering = (severity: string): number => {
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
      default:
        return 5
    }
  };

  async function checkForCacheVolume() {
    var exists = false;
    await window.ddClient.docker.cli
      .exec("volume", [
        "inspect",
        "trivy-docker-extension-cache"
      ])
      .then((result: any) => {
        console.log(result);
        if (result.stdout !== "") {
          exists = true;
        }
      }).catch((err: Error) => {
        console.log(err);
        exists = false;
      });
    return exists;
  }

  async function createCacheVolume() {
    var success = true;
    await window.ddClient.docker.cli
      .exec("volume", ["create", "trivy-docker-extension-cache"])
      .then((result: any) => {
        if (result.stderr !== "") {
          success = false;
        }
      });
    return success;
  }

  async function triggerTrivy() {
    resetUI();
    if (!(await checkForCacheVolume())) {
      await createCacheVolume().then((created) => {
        if (!created) {
          setLoadingWait(true);
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
    let commandParts: string[] = [
      "--rm",
      "-v",
      "/var/run/docker.sock:/var/run/docker.sock",
      "-v",
      "trivy-docker-extension-cache:/root/.cache"
    ];

    if (uploadAqua && !SBOMOutput) {
      commandParts.push("-e");
      commandParts.push("TRIVY_RUN_AS_PLUGIN=aqua");
      commandParts.push("-e");
      commandParts.push("AQUA_KEY=" + aquaKey);
      commandParts.push("-e");
      commandParts.push("AQUA_SECRET=" + aquaSecret);
    }


    commandParts.push("aquasec/trivy");
    commandParts.push("--quiet");
    if (SBOMOutput) {
      commandParts.push("sbom")
    } else {
      commandParts.push("image")
      commandParts.push("-f=json")
    }

    if (fixedOnly && !SBOMOutput) {
      commandParts.push("--ignore-unfixed");
    }
    commandParts.push(scanImage);
    ({ stdout, stderr } = await runTrivy(commandParts, stdout, stderr));
  }

  async function runTrivy(commandParts: string[], stdout: string, stderr: string) {
    SendMetric("trivy_scan_initiated", { imageName: scanImage });
    await window.ddClient.docker.cli.exec(
      "run", commandParts,
      {
        stream: {
          onOutput(data: any) {
            stdout += data.stdout;
            if (data.stderr) {
              stderr += data.stderr;
            }
          },
          onError(error: any) {
            window.ddClient.desktopUI.toast.error(
              `An error occurred while scanning ${scanImage}`
            );
            console.error(error);
          },
          onClose(exitCode: number) {
            setLoadingWait(false);
            setDisableScan(false);
            var res = { stdout: stdout, stderr: stderr };
            if (exitCode === 0) {
              if (uploadAqua && !SBOMOutput) {
                window.ddClient.desktopUI.toast.success(
                  `Results successfully uploaded to Aqua`
                );
              }
              SendMetric("trivy_scan_succeeded", { imageName: scanImage });
              processResult(res);
            } else {
              SendMetric("trivy_scan_failed", { imageName: scanImage });
              window.ddClient.desktopUI.toast.error(
                `An error occurred while scanning ${scanImage}: ${res.stderr}`
              );
            }
          },
        },
      }
    );
    return { stdout, stderr };
  }

  const processResult = (res: any) => {

    let vulns = [];
    if (res.stderr !== "") {
      return;
    }

    let output = res.stdout;

    if (uploadAqua) {
      output = output.slice(output.indexOf('{'));
    }

    console.log(output);
    var results = JSON.parse(output);

    if (SBOMOutput) {
      setShowSBOM("block");
      setSBOMContent(results);
      return;
    }



    if (results.Results === undefined) {
      setVulnerabilities([]);
      setShowFilter("none");
      setShowSuccess("block");
      return;
    }

    let all = 0;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let unknown = 0;


    for (let i = 0; i < results.Results.length; i++) {
      let r = results.Results[i];
      if (r.Vulnerabilities === undefined) {
        continue;
      }
      for (let j = 0; j < r.Vulnerabilities.length; j++) {
        let v = r.Vulnerabilities[j];
        vulns.push(new TrivyVulnerability(v));
        all += 1;
        switch (v.Severity) {
          case "CRITICAL":
            critical += 1;
            break;
          case "HIGH":
            high += 1;
            break;
          case "MEDIUM":
            medium += 1;
            break;
          case "LOW":
            low += 1;
            break;
          default:
            unknown += 1;
        }
      }
    }

    setAll(all);
    setCritical(critical);
    setHigh(high);
    setMedium(medium);
    setLow(low);
    setUnknown(unknown);

    vulns.sort((a, b) => {
      if (getSeverityOrdering(a.severity) === getSeverityOrdering(b.severity)) {
        return a.pkgName >= b.pkgName ? 1 : -1;
      }
      return getSeverityOrdering(a.severity) >= getSeverityOrdering(b.severity)
        ? 1
        : -1;
    });

    if (all === 0) {
      console.debug("No results, showing the success screen");
      setShowSuccess("block");
      setShowFilter("none");
    } else {
      setShowFilter("block");
    }
    setAllVulnerabilities(vulns);
    setVulnerabilities(vulns);
  }

  const runScan = () => {
    setLoadingWait(true);
    setShowDefaultDisplay("block");
    setShowWelcome("none");
    triggerTrivy();
  }

  const resetUI = () => {
    setAll(0);
    setCritical(0);
    setHigh(0);
    setMedium(0);
    setLow(0);
    setUnknown(0);
    setVulnerabilities([]);
    setShowSuccess("none");
    setShowSBOM("none");
    setShowFilter("none");
  }

  const triggerFilter = (e: React.MouseEvent<HTMLElement>, obj: string) => {
    setSeverityFilter(obj);
    if (obj === "all") {
      setVulnerabilities(allVulnerabilities);
      return;
    }
    const filtered = allVulnerabilities.filter((v) => v.severityClass === obj);

    setVulnerabilities(filtered);
  }

  const imageUpdated = () => {
    resetUI();
  }

  React.useEffect(() => {
    if (aquaKey !== "" && aquaSecret !== "") {
      setShowUploadAqua("");
    } else {
      setShowUploadAqua("none");
    }
  }, [aquaKey, aquaSecret]);

  React.useEffect(() => {
    window.ddClient.extension.vm.service.get("/credentials").then((value: any) => {
      setAquaKey(value.aqua_key);
      setAquaSecret(value.aqua_secret);
      if (value.aqua_key !== "" && value.aqua_secret !== "") {
        setLoggedIn(true);
      }
    }).catch((err: any) => {
      console.log(err);
    });
    SendMetric("trivy_extension_opened", {});
  }, []);


  return (
    <DockerMuiThemeProvider>
      <div>
        <CssBaseline />
        {/* Entry point to the extension - large hero with description and scan box */}
        <ConfigureCreds sx={{ float: 'right' }}
          open={showLoginBox}
          setOpen={setShowLoginBox}
          aquaKey={aquaKey}
          setAquaKey={setAquaKey}
          aquaSecret={aquaSecret}
          setAquaSecret={setAquaSecret}
          loggedIn={loggedIn}
          setLoggedIn={setLoggedIn}
        />
        <Box sx={{ clear: 'both' }}>
          <Welcome
            showWelcome={showWelcome}
            scanImage={scanImage}
            disableScan={disableScan}
            setDisableScan={setDisableScan}
            setScanImage={setScanImage}
            fixedOnly={fixedOnly}
            setFixedOnly={setFixedOnly}
            SBOMOutput={SBOMOutput}
            setSBOMOutput={setSBOMOutput}
            runScan={runScan}
            imageUpdated={imageUpdated}
            uploadAqua={uploadAqua}
            setUploadAqua={setUploadAqua}
            showUploadAqua={showUploadAqua}
            openLogin={setShowLoginBox}
            loggedIn={loggedIn}
          />
          {/* Top level interaction point - hidden when the welcome screen is displayed */}
          <DefaultDisplay
            showDefaultDisplay={showDefaultDisplay}
            scanImage={scanImage}
            disableScan={disableScan}
            setDisableScan={setDisableScan}
            setScanImage={setScanImage}
            fixedOnly={fixedOnly}
            setFixedOnly={setFixedOnly}
            SBOMOutput={SBOMOutput}
            setSBOMOutput={setSBOMOutput}
            runScan={runScan}
            imageUpdated={imageUpdated}
            uploadAqua={uploadAqua}
            setUploadAqua={setUploadAqua}
            showUploadAqua={showUploadAqua}
          />
          <SBOM
            SBOMContent={SBOMContent}
            showSBOM={showSBOM}
          />
          {/* Table of vulnerabilities with the filter control included in this component */}
          <Vulns
            vulnerabilties={vulnerabilities}
            severityFilter={severityFilter}
            triggerFilter={triggerFilter}
            showFilter={showFilter}
            all={all}
            critical={critical}
            high={high}
            medium={medium}
            low={low}
            unknown={unknown}
            SBOMOutput={SBOMOutput}
            setSBOMOutput={setSBOMOutput}
            runScan={runScan}
          />
          {/* Component that is displayed when the scan completes without issue */}
          <Success
            scanImage={scanImage}
            showSuccess={showSuccess}
          />
          {/* Shim to block the screen when the scan is loading  */}
          <Loading
            showLoading={loadingWait}
          />
        </Box>
      </div>
    </DockerMuiThemeProvider >
  );
}