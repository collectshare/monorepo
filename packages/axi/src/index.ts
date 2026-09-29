import { dispatch, type Registry } from "./cli/router.js";
import { homeCommand, rootHelp } from "./commands/home.js";
import { authLogout, authOpen, authSetKey, authStatus } from "./commands/auth.js";
import { formsCreate, formsList, formsUpdate } from "./commands/forms.js";
import { questionsInsert } from "./commands/questions.js";
import { submissionsGet } from "./commands/submissions.js";
import { datasetsData } from "./commands/datasets.js";
import { portalSearch } from "./commands/portal.js";

const registry: Registry = {
  tool: "axi",
  root: homeCommand,
  rootHelp,
  commands: {
    "forms create": formsCreate,
    "forms update": formsUpdate,
    "forms list": formsList,
    "forms questions insert": questionsInsert,
    "submissions get": submissionsGet,
    "datasets data": datasetsData,
    "portal search": portalSearch,
    "auth status": authStatus,
    "auth set-key": authSetKey,
    "auth logout": authLogout,
    "auth open": authOpen,
  },
  aliases: {
    forms: "forms list",
    submissions: "submissions get",
    datasets: "datasets data",
    portal: "portal search",
    auth: "auth status",
  },
};

const code = await dispatch(registry, process.argv.slice(2));
process.exit(code);
