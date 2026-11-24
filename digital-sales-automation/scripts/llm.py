"""
Claude API 呼び出しの共通処理
- モデル名は .env で上書きできる（CONTENT_MODEL / RESEARCH_MODEL）
- クレジット不足・利用上限到達は CreditError として明示的に止める
"""
import json
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()

CONTENT_MODEL = os.getenv("CONTENT_MODEL", "claude-sonnet-5-5")
RESEARCH_MODEL = os.getenv("RESEARCH_MODEL", "claude-haiku-5-5")

# 拒否（refusal）時にサーバー側で別モデルへ自動フォールバックする（Sonnet 5.5のみ対応）
FALLBACK_BETA = "server-side-fallback-2026-07-01"
FALLBACK_MODELS = {"claude-sonnet-5-5"}


class CreditError(RuntimeError):
    """APIクレジット不足・利用上限到達。再試行しても直らない"""


class GenerationError(RuntimeError):
    """生成が途中で止まった・拒否された"""


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _is_credit_error(e: Exception) -> bool:
    if isinstance(e, (anthropic.PaymentRequiredError, anthropic.EnforcedSpendLimitReachedError)):
        return True
    # 残高不足は 400 invalid_request_error で返ることがある
    if isinstance(e, anthropic.BadRequestError):
        msg = str(e).lower()
        return "credit balance" in msg or "billing" in msg
    return False


def call_text(
    prompt: str,
    *,
    model: str = CONTENT_MODEL,
    system: str | None = None,
    max_tokens: int = 16000,
    effort: str = "medium",
) -> str:
    """ストリーミングで1回呼び出し、本文テキストを返す"""
    kwargs = dict(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
        output_config={"effort": effort},
    )
    if system:
        kwargs["system"] = system

    client = _client()
    try:
        if model in FALLBACK_MODELS:
            with client.beta.messages.stream(
                betas=[FALLBACK_BETA], fallbacks="default", **kwargs
            ) as stream:
                message = stream.get_final_message()
        else:
            with client.messages.stream(**kwargs) as stream:
                message = stream.get_final_message()
    except anthropic.APIError as e:
        if _is_credit_error(e):
            raise CreditError(
                "Anthropic APIのクレジットが不足しているか、利用上限に達しています。"
                "https://console.anthropic.com/settings/billing で残高と上限を確認してください。"
            ) from e
        raise

    if message.stop_reason == "refusal":
        raise GenerationError("モデルが生成を拒否しました。テーマを変えて再実行してください。")
    if message.stop_reason == "max_tokens":
        raise GenerationError(f"max_tokens={max_tokens} に達して本文が途中で切れました。")

    return "".join(b.text for b in message.content if b.type == "text").strip()


def extract_json(raw: str):
    """```json フェンスや前後の文章が混じっても JSON 部分だけを取り出す"""
    text = raw.strip()
    if "```" in text:
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
            if text.startswith("json"):
                text = text[4:]
    text = text.strip()
    starts = [i for i in (text.find("["), text.find("{")) if i != -1]
    if starts:
        start = min(starts)
        end = max(text.rfind("]"), text.rfind("}"))
        text = text[start : end + 1]
    return json.loads(text)
