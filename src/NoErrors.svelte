<script>
  export let selected;
</script>

<div class="noerrors">
  <img src="./build/images/tada.svg" alt="Tada" width="90px" />
  <h2>No vulnerabilities where found with {selected}</h2>
</div>

<style>
  .noerrors {
    width: 100%;
    text-align: center;
    vertical-align: middle;
    padding-top: 10%;
  }

  h2 {
    font-weight: 500;
    font-size: 24px;
    font-family: "Open Sans";
  }
</style>
