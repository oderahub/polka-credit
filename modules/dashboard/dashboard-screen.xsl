<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes"/>

  <xsl:template match="/screen">
    <html>
      <head>
        <title><xsl:value-of select="@name"/> - UI Spec</title>
        <style>
          body { font-family: system-ui; max-width: 760px; margin: 40px auto; padding: 20px; background: #f7f7f7; color: #111; }
          .region { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin: 14px 0; background: white; }
          .region-name { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.08em; }
          .component { background: #f5f5f5; padding: 10px; border-radius: 6px; margin: 8px 0; }
          .action { display: inline-block; background: #0066ff; color: white; padding: 8px 16px; border-radius: 6px; margin: 4px 6px 4px 0; font-size: 14px; }
          .action[role=secondary] { background: #eee; color: #333; }
          .state-label { font-size: 11px; background: #fff3bf; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
          .error { color: #cc0000; }
          .property { display: inline-block; background: #eef4ff; border-radius: 999px; padding: 3px 8px; margin: 3px 6px 0 0; font-size: 12px; }
        </style>
      </head>
      <body>
        <h2><xsl:value-of select="@name"/></h2>
        <p style="color:#666"><xsl:value-of select="@intent"/></p>
        <hr/>
        <div class="region">
          <div class="region-name">ViewModel</div>
          <xsl:for-each select="viewModel/property">
            <span class="property"><xsl:value-of select="@name"/></span>
          </xsl:for-each>
        </div>
        <xsl:apply-templates select="layout/region"/>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="region">
    <div class="region">
      <div class="region-name"><xsl:value-of select="@name"/></div>
      <xsl:apply-templates/>
    </div>
  </xsl:template>

  <xsl:template match="conditional">
    <div>
      <span class="state-label">State: <xsl:value-of select="@state"/></span>
      <xsl:apply-templates/>
    </div>
  </xsl:template>

  <xsl:template match="component">
    <div class="component">
      [<xsl:value-of select="@type"/>]
      <xsl:if test="@binding"> ← <xsl:value-of select="@binding"/></xsl:if>
      <xsl:apply-templates/>
    </div>
  </xsl:template>

  <xsl:template match="text">
    <p>
      <xsl:value-of select="@content"/>
      <xsl:if test="@binding"> (<xsl:value-of select="@binding"/>)</xsl:if>
    </p>
  </xsl:template>

  <xsl:template match="action">
    <span>
      <xsl:attribute name="class">action</xsl:attribute>
      <xsl:if test="@role">
        <xsl:attribute name="role"><xsl:value-of select="@role"/></xsl:attribute>
      </xsl:if>
      <xsl:value-of select="@label"/>
    </span>
  </xsl:template>
</xsl:stylesheet>
