import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { getAssetUrl } from "@/core/runtime.ts";

export const PasskeyTab: Component = () => {
  const [activeSubTab, setActiveSubTab] = createSignal<"register" | "login">(
    "register",
  );

  const heroImage = getAssetUrl("images/guide_hero.png");
  const imgRegStep1 = getAssetUrl(
    "images/passkey/1 select create pk.jpg",
  );
  const imgRegStep2 = getAssetUrl(
    "images/passkey/2 select account to store pk.jpg",
  );
  const imgRegStep3 = getAssetUrl("images/passkey/3 pk saved.jpg");
  const imgLoginStep1 = getAssetUrl(
    "images/passkey/4 click login with pk.jpg",
  );
  const imgLoginStep2 = getAssetUrl(
    "images/passkey/5 select your account.jpg",
  );

  return (
    <section class="tab-panel fade-in">
      <div class="panel-header">
        <h2>⚡ {t("guide_pk_header_title")}</h2>
        <p>{t("guide_pk_header_desc")}</p>
      </div>

      {/* Sub-tab Selector */}
      <div class="sub-tab-selector">
        <button
          class={`sub-tab-btn ${activeSubTab() === "register" ? "active" : ""}`}
          onClick={() => setActiveSubTab("register")}
        >
          {t("guide_pk_subtab_reg")}
        </button>
        <button
          class={`sub-tab-btn ${activeSubTab() === "login" ? "active" : ""}`}
          onClick={() => setActiveSubTab("login")}
        >
          {t("guide_pk_subtab_login")}
        </button>
      </div>

      <Show when={activeSubTab() === "register"}>
        {/* REGISTRATION GUIDE */}
        <div class="tab-panel-intro">
          <h3>📝 {t("guide_pk_reg_title")}</h3>
          <p>{t("guide_pk_reg_desc")}</p>
        </div>

        <div class="steps-vertical">
          {/* STEP 1 */}
          <div class="vertical-step-card">
            <div class="step-index">1</div>
            <div class="step-content">
              <h3>{t("guide_pk_reg_step1_title")}</h3>
              <p>{t("guide_pk_reg_step1_desc")}</p>

              <div class="tutorial-image-container">
                <div class="image-wrapper">
                  <img
                    src={imgRegStep1}
                    alt="Register Step 1"
                    class="tutorial-img"
                    onerror={(e) => {
                      const img = e.currentTarget;
                      if (img instanceof HTMLImageElement) {
                        img.src = heroImage;
                        img.style.opacity = "0.3";
                      }
                    }}
                  />
                  <div class="image-placeholder-info">
                    <span>💡 {t("guide_pk_reg_step1_img_info")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div class="vertical-step-card">
            <div class="step-index">2</div>
            <div class="step-content">
              <h3>{t("guide_pk_reg_step2_title")}</h3>
              <p>{t("guide_pk_reg_step2_desc")}</p>

              <div class="tutorial-image-container">
                <div class="image-wrapper">
                  <img
                    src={imgRegStep2}
                    alt="Register Step 2"
                    class="tutorial-img"
                    onerror={(e) => {
                      const img = e.currentTarget;
                      if (img instanceof HTMLImageElement) {
                        img.src = heroImage;
                        img.style.opacity = "0.3";
                      }
                    }}
                  />
                  <div class="image-placeholder-info">
                    <span>💡 {t("guide_pk_reg_step2_img_info")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div class="vertical-step-card">
            <div class="step-index">3</div>
            <div class="step-content">
              <h3>{t("guide_pk_reg_step3_title")}</h3>
              <p>{t("guide_pk_reg_step3_desc")}</p>

              <div class="tutorial-image-container">
                <div class="image-wrapper">
                  <img
                    src={imgRegStep3}
                    alt="Register Step 3"
                    class="tutorial-img"
                    onerror={(e) => {
                      const img = e.currentTarget;
                      if (img instanceof HTMLImageElement) {
                        img.src = heroImage;
                        img.style.opacity = "0.3";
                      }
                    }}
                  />
                  <div class="image-placeholder-info">
                    <span>💡 {t("guide_pk_reg_step3_img_info")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={activeSubTab() === "login"}>
        {/* LOGIN GUIDE */}
        <div class="tab-panel-intro">
          <h3>🔑 {t("guide_pk_login_title")}</h3>
          <p>{t("guide_pk_login_desc")}</p>
        </div>

        <div class="steps-vertical">
          {/* STEP 1 */}
          <div class="vertical-step-card">
            <div class="step-index">1</div>
            <div class="step-content">
              <h3>{t("guide_pk_login_step1_title")}</h3>
              <p>{t("guide_pk_login_step1_desc")}</p>

              <div class="tutorial-image-container">
                <div class="image-wrapper">
                  <img
                    src={imgLoginStep1}
                    alt="Login Step 1"
                    class="tutorial-img"
                    onerror={(e) => {
                      const img = e.currentTarget;
                      if (img instanceof HTMLImageElement) {
                        img.src = heroImage;
                        img.style.opacity = "0.3";
                      }
                    }}
                  />
                  <div class="image-placeholder-info">
                    <span>💡 {t("guide_pk_login_step1_img_info")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div class="vertical-step-card">
            <div class="step-index">2</div>
            <div class="step-content">
              <h3>{t("guide_pk_login_step2_title")}</h3>
              <p>{t("guide_pk_login_step2_desc")}</p>

              <div class="tutorial-image-container">
                <div class="image-wrapper">
                  <img
                    src={imgLoginStep2}
                    alt="Login Step 2"
                    class="tutorial-img"
                    onerror={(e) => {
                      const img = e.currentTarget;
                      if (img instanceof HTMLImageElement) {
                        img.src = heroImage;
                        img.style.opacity = "0.3";
                      }
                    }}
                  />
                  <div class="image-placeholder-info">
                    <span>💡 {t("guide_pk_login_step2_img_info")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </section>
  );
};

export default PasskeyTab;
