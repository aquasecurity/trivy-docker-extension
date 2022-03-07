<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  const ignoredImages = ["aquasec/trivy", "trivy-docker-extension"];

  let imagesPromise = getImages();

  export let disableButton = false;

  async function getImages() {
    let images = [];
    try {
      images = await window.ddClient.docker.listImages();
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

  function checkForEnter(e) {
    e = e || window.event;
    if (e.keyCode == 13) {
      startScan();
    }
  }

  function updateSelected(event) {
    let e = event.target;
    selected = e.options[e.selectedIndex].text;
  }

  function startScan() {
    disableButton = true;
    dispatch("startscan", {
      image: selected,
    });
  }

  let selected;
</script>

<label class="top-label" for="images">Select an image to scan with Trivy</label>
<div>
  <div class="select-editable">
    <select class="imagelist" on:change={updateSelected}>
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
    <input
      type="text"
      name="format"
      bind:value={selected}
      on:keyup={checkForEnter}
    />
  </div>

  <button
    id="scanbtn"
    class="scan"
    disabled={disableButton}
    on:click={startScan}>Scan</button
  >
</div>

<style>
  button.scan {
    flex-direction: row;
    align-items: center;
    padding: 8px;

    width: 86px;
    height: 42px;

    background: #08b1d5;
    color: white;
    border-style: none;

    font-weight: 700;
    font-size: 16px;
    border-radius: 4px;
    position: absolute;
    margin-left: 5px;
    cursor: pointer;
  }

  button.scan:disabled {
    cursor: not-allowed;
    background-color: darkgray;
  }

  .select-editable {
    position: relative;
    border: solid grey 1px;
    width: 450px;
    height: 40px;
    display: inline-block;
  }

  .select-editable select {
    background: white;
    top: 0px;
    left: 0px;
    font-size: 16px;
    height: 40px;
    min-width: 450px;
    border: none;
    width: 120px;
    padding-left: 4px;
    margin: 0;
    background: url(./images/br_down.png) no-repeat #fff;
    -webkit-appearance: none;
    background-position: calc(100% - 15px) 0.7em, calc(100% - 20px) 1em,
      calc(100% - 2.5em) 0.5em;
  }
  .select-editable input {
    position: absolute;
    top: 0px;
    left: 0px;
    padding: 1px;
    min-width: 400px;
    height: 38px;
    font-size: 16px;
    border: none;
    padding-left: 6px;
  }
  .select-editable select:focus,
  .select-editable input:focus {
    outline: none;
  }

  .top-label {
    color: white;
    padding-top: 16px;
    padding-bottom: 8px;
  }
</style>
