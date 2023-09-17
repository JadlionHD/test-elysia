import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { html } from "@elysiajs/html";
import ejs from "ejs";
import { readFile } from "fs/promises";

async function getEjs(fileName: string) {
  return (await readFile(`views/${fileName}`, { encoding: "utf-8" })).toString();
}

const app = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: "Reimu Hakurei",
      exp: "1m"
    })
  )
  .use(cookie())
  .use(html())

  .get("/home", async ({ jwt, set, cookie: { token } }) => {
    const html = await getEjs("Profile.ejs");
    const profile = await jwt.verify(token);

    console.log(profile);
    if (!profile) {
      set.status = 401;
      return new Response("Unauthorized");
    }

    return ejs.render(html);
  })

  .post(
    "/api/sign-in",
    async ({ jwt, set, setCookie, body }) => {
      if (body.username === "admin" && body.password === "admin") {
        const token = await jwt.sign({
          username: body.username
        });

        setCookie("token", token, {
          httpOnly: true,
          maxAge: 1 * 60000
        });

        set.redirect = "/home";
        return {
          done: true
        };
      } else {
        set.status = 400;
        return "Invalid data";
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String()
      }),

      response: {
        200: t.Object({
          done: t.Boolean()
        }),
        400: t.String()
      }
    }
  )
  .get("/", async () => {
    const html = await getEjs("Login.ejs");
    return ejs.render(html);
  })

  .listen(3000);

console.log("ElysiaJS Ready on: http://localhost:3000");
