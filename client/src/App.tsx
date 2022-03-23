
import CssBaseline from '@mui/material/CssBaseline';
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme';
import { Box } from '@mui/system';
import { ImageList } from './ImageList';
import React from 'react';
import { Loading } from './Loading';
import ToggleButton from '@mui/material/ToggleButton';
import Card from '@mui/material/Card';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Vulns } from './Vulns';
import { Links } from './Links';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';



export function App() {

  const [scanImage, setScanImage] = React.useState("");
  const [all, setAll] = React.useState(0);
  const [critical, setCritical] = React.useState(0);
  const [high, setHigh] = React.useState(0);
  const [medium, setMedium] = React.useState(0);
  const [low, setLow] = React.useState(0);
  const [unknown, setUnknown] = React.useState(0);
  const [showFilter, setShowFilter] = React.useState("none");
  const [showSuccess, setShowSuccess] = React.useState("none");
  const [displayStandard, setDisplayStandard] = React.useState("none");
  const [displayWelcome, setDisplayWelcome] = React.useState("block");
  const [vulnerabilities, setVulnerabilities] = React.useState<TrivyVulnerability[]>([]);
  const [allVulnerabilities, setAllVulnerabilities] = React.useState<TrivyVulnerability[]>([]);
  const [loadingWait, setLoadingWait] = React.useState(false);

  class TrivyVulnerability {
    id: string
    title: string
    severity: string
    severityClass: string
    description: string
    pkgName: string
    installedVersion: string
    fixedVersion: string
    references: string[]
    primaryURL: string
    visible: boolean
    constructor(v: any) {
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

    }
  }

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
    }
    return -1;
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


  function runScan(fixedOnly: boolean) {
    setLoadingWait(true);
    setDisplayStandard("block");
    setDisplayWelcome("none");
    triggerTrivy(fixedOnly);
  }

  async function triggerTrivy(fixedOnly: boolean) {
    resetCounters();

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
      "trivy-docker-extension-cache:/root/.cache",
      "aquasec/trivy",
      "--quiet",
      "image",
      "-f=json"
    ];

    if (fixedOnly) {
      commandParts.push("--ignore-unfixed");
    }
    commandParts.push(scanImage);
    console.log(commandParts);

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
            if (exitCode === 0) {
              window.ddClient.desktopUI.toast.success(
                `Scan of ${scanImage} completed successfully`
              );
              var res = { stdout: stdout, stderr: stderr };
              processResult(res);
            } else {
              window.ddClient.desktopUI.toast.error(
                `An error occurred while scanning ${scanImage}`
              );
            }
          },
        },
      }
    );
  }

  function processResult(res: any) {
    let all = 0;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let unknown = 0;

    let vulns = [];
    if (res.stderr !== "") {
      return;
    }

    var results = JSON.parse(res.stdout);
    if (results.Results === undefined) {
      setVulnerabilities([]);
      setShowFilter("none");
      setShowSuccess("block");
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
        return a.id >= b.id ? 1 : -1;
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
    if (vulnerabilities.length === 0) {
      //noErrors = true;
    }
  }


  function resetCounters() {
    setVulnerabilities([]);
    setAll(0);
    setCritical(0);
    setHigh(0);
    setMedium(0);
    setLow(0);
    setUnknown(0);
    setShowSuccess("none");
    setShowFilter("none");
  }

  const [severityFilter, setSeverityFilter] = React.useState("all");
  function triggerFilter(e: any, obj: string) {
    setSeverityFilter(obj);
    if (obj === "all") {
      setVulnerabilities(allVulnerabilities);
      return;
    }
    const filtered = allVulnerabilities.filter((v) => v.severityClass === obj);

    setVulnerabilities(filtered);
  }

  function imageUpdated() {
    setShowFilter("none");
    resetCounters();
    setVulnerabilities([]);
  }


  function goToTrivy() {
    window.ddClient.host.openExternal("https://trivy.dev")
  }

  return (
    <DockerMuiThemeProvider>
      <div>
        <CssBaseline />
        <Box sx={{ display: displayStandard, marginTop: '2rem' }}>
          <Box sx={{ m: '2rem' }}>
            <Links />
            <Box sx={{ display: 'flex' }}>
              <img src="images/trivy_logo.svg" alt="Trivy Logo" height="100px" />
              <Box sx={{ marginLeft: '0.5rem', marginTop: '0.7rem' }}>
                <Typography variant="h4" fontFamily='Droplet'>
                  aqua
                </Typography>
                <Typography variant="h2" fontFamily='Droplet'>
                  trivy
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ marginLeft: '2rem' }}>
            <ImageList
              scanImage={scanImage}
              setScanImage={setScanImage}
              runScan={runScan}
              imageUpdated={imageUpdated}
            />
          </Box>
        </Box>
        <Box sx={{ m: '0.5rem' }}>
          <ToggleButtonGroup
            value={severityFilter}
            exclusive
            onChange={triggerFilter}
            sx={{ marginLeft: '2rem', marginTop: '1.5rem', marginBottom: '0.8rem', marginRight: '1.5rem', float: "right", display: showFilter }}
          >
            <ToggleButton value="all" >All ({all})</ToggleButton>
            <ToggleButton value="critical" disabled={critical === 0}>
              <Typography color="red">┃ </Typography>
              Critical ({critical})</ToggleButton>
            <ToggleButton value="high" disabled={high === 0} >
              <Typography color="orangered">┃ </Typography>
              High ({high})</ToggleButton>
            <ToggleButton value="medium" disabled={medium === 0} >
              <Typography color="orange">┃ </Typography>
              Medium ({medium})</ToggleButton>
            <ToggleButton value="low" disabled={low === 0} >
              <Typography color="gray">┃ </Typography>
              Low ({low})</ToggleButton>
            <ToggleButton value="unknown" disabled={unknown === 0} >
              <Typography color="gray">┃ </Typography>
              Unknown ({unknown})</ToggleButton>

          </ToggleButtonGroup>
        </Box>
        <Box sx={{ minWidth: 275, m: '8rem', display: displayWelcome }}>
          <Card raised variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex' }}>
                <img src="images/trivy_logo.svg" alt="Trivy Logo" height="200px" />
                <Box sx={{ marginLeft: '0.5rem', marginTop: '1.7rem' }}>
                  <Typography variant="h3" fontFamily='Droplet'>
                    aqua
                  </Typography>
                  <Typography variant="h1" fontFamily='Droplet'>
                    trivy
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h4" component="div" gutterBottom sx={{ marginTop: '4rem' }}>
                Free, open-source container image scanning for local and remote images.
              </Typography>

              <Typography variant="h5" sx={{ marginTop: '2rem' }}>
                <img src="images/tada.svg" alt="Tada Logo" height="20px" /> Scan unlimited images, no sign up required! <img src="images/tada.svg" alt="Tada Logo" height="20px" />
              </Typography>

              <Typography variant="h5" sx={{ marginTop: '2rem' }}>
                Select from one of your locally installed images or simply type the name of the remote image you wish to scan. <br />
                Scans run locally, nothing leaves your machine.
              </Typography>
              <Box sx={{ marginTop: '3rem' }}>
                <ImageList
                  scanImage={scanImage}
                  setScanImage={setScanImage}
                  runScan={runScan}
                  imageUpdated={imageUpdated}
                />
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={goToTrivy}>Learn More</Button>
            </CardActions>

          </Card>
        </Box>
        <Box sx={{ minWidth: 275, m: '10rem', p: '2rem', marginTop: '5rem', textAlign: 'center', display: showSuccess }}>
          <Card>
            <CardContent>

              <Typography variant="h3" component="div" gutterBottom sx={{ marginTop: '4rem' }}>
                Great News!
              </Typography>
              <img src="images/tada.svg" alt="Tada Logo" height="200px" />


              <Typography variant="h4" sx={{ marginTop: '2rem' }}>
                No vulnerabilities were found in {scanImage}
              </Typography>
            </CardContent>

          </Card>
        </Box>
        <Vulns vulnerabilties={vulnerabilities} />
        <Loading showLoading={loadingWait} />
      </div>
    </DockerMuiThemeProvider >
  );
}

