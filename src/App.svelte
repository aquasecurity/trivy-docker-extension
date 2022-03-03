<script>
    import Loading from "./Loading.svelte";

    import { slide } from "svelte/transition";

    const ignoredImages = ["aquasec/trivy", "trivy-docker-extension"];

    let imagesPromise = getImages();

    async function getImages() {
        let images = [];
        try {
            images = await window.ddClient.listImages();
        } catch (images) {
            return images;
        }
        return images
            .map((images) => images.RepoTags)
            .sort()
            .filter((images) => images && "<none>:<none>" !== images[0])
            .filter((images) => {
                for (let i = 0; i < ignoredImages.length; i++) {
                    if (images[0].startsWith(ignoredImages[i])) {
                        return false;
                    }
                }
                return true;
            })
            .flat();
    }

    class TrivyVulnerability {
        constructor(v) {
            this.id = v.VulnerabilityID;
            this.title = v.Title;
            this.severity = v.Severity;
            this.severityClass = v.Severity.toLowerCase();
            this.description = v.Description;
            this.pkgName = v.PkgName;
            this.installedVersion = v.InstalledVersion;
            this.fixedVersion = v.FixedVersion;
            this.references = v.References;
            this.primaryURL = v.PrimaryURL;
            this.visible = false;
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

    async function createCacheVolume() {
        const createCacheCmd = `volume create trivycache`;
        console.log(createCacheCmd);

        var success = true;

        await window.ddClient.execDockerCmd(createCacheCmd).then((result) => {
            if (result.stderr !== "") {
                success = false;
            }
        });
        return success;
    }

    async function triggerTrivy() {
        var loadingOverlay = document.querySelector(".loading");
        loadingOverlay.classList.remove("hidden");

        await createCacheVolume().then((created) => {
            if (!created) {
                loadingOverlay.classList.add("hidden");
                console.log("failed to create volume");
                return;
            }
        });

        const dockerCmd = `run --rm -v trivycache:/root/.cache/ aquasec/trivy --quiet image -f=json  ${selected}`;
        console.log(dockerCmd);

        await window.ddClient.execDockerCmd(dockerCmd).then((res) => {
            loadingOverlay.classList.add("hidden");
            var results = JSON.parse(res.stdout);
            let vulns = [];

            if (results.Results === undefined) {
                vulnerabilities = [];
                return;
            }
            for (let i = 0; i < results.Results.length; i++) {
                let r = results.Results[i];
                if (r.Vulnerabilities === undefined) {
                    vulnerabilities = [];
                    return;
                }
                for (let j = 0; j < r.Vulnerabilities.length; j++) {
                    let v = r.Vulnerabilities[j];
                    vulns.push(new TrivyVulnerability(v));
                }
            }

            vulns.sort((a, b) => {
                if (
                    getSeverityOrdering(a.severity) <
                    getSeverityOrdering(b.severity)
                ) {
                    return -1;
                } else if (
                    getSeverityOrdering(a.severity) >
                    getSeverityOrdering(b.severity)
                ) {
                    return 1;
                }
                return 0;
            });

            console.log(vulns);
            vulnerabilities = vulns;
        });
    }

    function expandDetail() {
        let vulnIndex = this.getAttribute("vulnerability");
        vulnerabilities[vulnIndex].visible =
            !vulnerabilities[vulnIndex].visible;

        // let content = this.nextElementSibling;
        // if (content.style.display === "block") {
        //     content.style.display = "none";
        // } else {
        //     content.style.display = "block";
        //     content.setAttribute("transition:slide", true);
        // }
    }

    let selected;

    let vulnerabilities = [];
</script>

<main>
    <div class="header">
        <h1>Trivy</h1>
        <label class="top-label" for="images"
            >Select an image to scan with Trivy</label
        >

        <select
            class="imagelist"
            aria-placeholder="Image Name"
            bind:value={selected}
        >
            {#await imagesPromise}
                <option>Loading images</option>
            {:then foundImages}
                <option />
                {#each foundImages as image}
                    <option>{image}</option>
                {/each}
            {:catch error}
                <option>{error}</option>
            {/await}
        </select>
        <button class="scan" on:click={triggerTrivy}>Scan</button>
    </div>

    <Loading />
    <div class="container">
        {#each vulnerabilities as v, index (v)}
            <button
                type="button"
                class="collapsible"
                vulnerability={index}
                on:click={expandDetail}
            >
                <div class="severity-label">
                    <div class="severity-pill {v.severityClass}">
                        {v.severity}
                    </div>
                </div>
                <div class="id-label">{v.id}</div>
                <div class="title-label">{v.title}</div>
            </button>
            {#if v.visible}
                <div class="content" transition:slide>
                    <table class="fulltable">
                        <tr>
                            <td class="description" colspan="2"
                                >{v.description}</td
                            >
                        </tr>
                        <tr>
                            <td class="detailheading">Package Name:</td>
                            <td>{v.pkgName}</td>
                        </tr>
                        <tr>
                            <td class="detailheading">Installed Version:</td>
                            <td>{v.installedVersion}</td>
                        </tr>
                        <tr>
                            <td class="detailheading">Fixed Version:</td>
                            <td>{v.fixedVersion}</td>
                        </tr>
                        <tr>
                            <td class="detailheading">More information:</td>
                            <td
                                ><span
                                    class="link"
                                    on:click={window.ddClient.openExternal(
                                        v.primaryURL
                                    )}>{v.primaryURL}</span
                                ></td
                            >
                        </tr>
                        <!-- <tr>
                        <td class="detailheading">References:</td>
                        <td
                            ><ul class="links">
                                {#each v.references as reference}
                                    <li class="link-item">
                                        <a href={reference}>{reference}</a>
                                    </li>
                                {/each}
                            </ul>
                        </td>
                    </tr> -->
                    </table>
                </div>
            {/if}
        {/each}
    </div>
</main>

<style>
    main {
    }

    .header {
        background-image: url("images/trivy.png");
        background-size: cover;
        background-position: center;
        padding: 30px;
        padding-top: 200px;
        padding-bottom: 220px;
    }

    h1 {
        font-family: "Droplet";
        font-size: 36pt;
        font-weight: 500;
        color: white;
    }

    .imagelist {
        font-weight: 14pt;
        height: 40px;
    }

    button.scan {
        flex-direction: row;
        align-items: center;
        padding: 8px;

        width: 86px;
        height: 40px;

        background: #0904da;
        color: white;
        border-style: none;

        font-weight: 700;
        font-size: 16px;
        border-radius: 4px;
    }

    button.collapsible:nth-of-type(odd) {
        background-color: #e6eaec;
    }

    button.collapsible:nth-of-type(even) {
        background-color: white;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }

    .severity-pill.critical {
        background-color: red;
        color: #fff;
    }

    .severity-pill {
        border-radius: 4px;
        padding: 5px;
        text-transform: uppercase;
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        width: 80px;
    }

    .severity-pill.high {
        background-color: orangered;
        color: #fff;
    }

    .severity-pill.medium {
        background-color: orange;
        color: #fff;
    }

    .severity-pill.low {
        background-color: #666;
        color: #fff;
    }

    .severity-pill.unknown {
        background-color: #666;
        color: #fff;
    }

    .collapsible {
        color: black;
        cursor: pointer;
        padding: 18px;
        width: 100%;
        text-align: left;
        outline: none;
        font-size: 15px;
        display: flex;
        border: none;
    }

    .top-label {
        color: white;
        padding-bottom: 10px;
    }

    .detailheading {
        font-weight: bold;
        vertical-align: top;
        width: 150px;
    }

    .description {
        font-style: italic;
        padding-bottom: 10px;
        line-height: 1.6em;
    }

    .links {
        padding-inline-start: 0;
        margin-block-start: 0;
    }

    .link {
        list-style-type: none;
        padding-bottom: 3px;
        cursor: pointer;
        color: #08b1d5;
    }

    .content {
        overflow: hidden;
        background-color: #fff;
        padding-top: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid grey;
    }

    .id-label {
        width: 180px;
        margin-top: 5px;
    }

    .title-label {
        flex-grow: 1;
        margin-top: 5px;
    }

    .severity-label {
        width: 120px;
        text-align: center;
    }
</style>
