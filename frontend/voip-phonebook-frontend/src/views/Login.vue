<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="login">
      <label for="email">Email Address:</label>
      <input type="text" id="email" v-model="email" required>
      <br>
      <label for="password">Password:</label>
      <input type="password" id="password" v-model="password" required>
      <br>
      <button type="submit">Login</button>
      <p v-if="error" style="color: red;">{{ error }}</p>
    </form>
  </div>
</template>

<script>
import { login, get_session } from '../auth';

export default {
  data() {
    return {
      email: '',
      password: '',
      error: ''
    };
  },
  methods: {
    async login() {
      // Perform login logic here
      // For simplicity, let's assume successful login
      const result = await login(this.email, this.password);

      if (result.error == undefined) {
        this.$router.push('/');
      } else {
        this.error = `${result.error} (${result.message})`;
      }
    }
  }
};
</script>