<template>
  <div id="app">
    <router-view></router-view>
    <notifications group="main" />
  </div>
</template>

<script>
  export default {
    name: 'wnreader'
  }
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Merriweather:700,400,400i');
:root {
  --bluebg: rgba(64, 185, 255, 0); 
  --biolet: rgb(66, 30, 228);
  --greybg: rgb(242, 242, 242);
  --blackbg: rgb(36, 35, 35);
}

#app, body, html {
  height: 100%;
  width: 100%;
}

body {
  position: relative;
  color: black;
  margin: 0;
  background-color: var(--greybg);
  font-family: Arial, Helvetica, Helvetica Neue, serif;
  overflow-y: hidden;
  user-select: none;
}

h2 {
  margin: 0;
  font-size: 2.25rem;
  font-weight: bold;
  letter-spacing: -0.025em;
  color: #fff;
}

li {
  list-style: none;
}

a {
  color: white;
  opacity: 0.75;
  text-decoration: none;
}

a:hover {
  opacity: 1;
  text-decoration: none;
  cursor: pointer;
}

.card {
    padding: 1em;
    background: white;
    box-shadow: 3px 2px 5px darkgrey;
    margin-top: 15px;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.loading {
  text-align: center;
  width: 100%;
  height: 40px;
  svg {
    animation: spin 2s ease-out infinite
  }
}
</style>
